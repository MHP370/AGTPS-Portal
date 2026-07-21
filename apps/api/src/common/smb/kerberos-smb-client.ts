import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { parseUncPath } from './smb-connection';

const execFileAsync = promisify(execFile);

function normalizeUsername(value: string) {
  const withoutDomain = value.includes('\\') ? value.split('\\').at(-1)! : value;
  return withoutDomain.split('@')[0];
}

function safeRemotePath(value: string) {
  if (/[\0\r\n";]/.test(value)) throw new Error('Invalid SMB path.');
  return value.replaceAll('/', '\\').replace(/^\\+|\\+$/g, '');
}

export async function downloadKerberosSmbFile(
  uncPath: string,
  username: string,
  relativePath: string,
  destination: string,
) {
  const parsed = parseUncPath(uncPath);
  if (!parsed) throw new Error('Invalid UNC path.');
  const remotePath = safeRemotePath(relativePath);
  if (!remotePath) throw new Error('SMB file path is required.');

  const cacheName = `FILE:/tmp/agtps-smb-${randomUUID()}`;
  const principal = process.env.KERBEROS_SERVICE_PRINCIPAL;
  if (!principal) throw new Error('Kerberos service principal is not configured.');
  const env = {
    ...process.env,
    KRB5CCNAME: cacheName,
    KRB5_CONFIG: '/etc/krb5.conf',
    KRB5_KTNAME: '/etc/krb5.keytab',
  };

  try {
    await execFileAsync(
      'kinit',
      ['-k', '-t', '/etc/krb5.keytab', principal],
      { env, timeout: 5000 },
    );
    await execFileAsync(
      'kvno',
      ['-U', normalizeUsername(username), '-P', `cifs/${parsed.host}`],
      { env, timeout: 5000 },
    );
    await execFileAsync(
      'smbclient',
      [
        `//${parsed.host}/${parsed.share}`,
        '-N',
        '--use-kerberos=required',
        '-c',
        `get "${remotePath}" "${destination}"`,
      ],
      { env, timeout: 30 * 60 * 1000, maxBuffer: 1024 * 1024 },
    );
  } finally {
    await execFileAsync('kdestroy', ['-c', cacheName], { env, timeout: 2000 }).catch(
      () => undefined,
    );
  }
}

function parseList(stdout: string) {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.match(/^\s{2}(.+?)\s{2,}([A-Z]+)\s+(\d+)\s{2,}(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .filter((match) => match[1].trim() !== '.' && match[1].trim() !== '..')
    .map((match) => {
      const name = match[1].trim();
      const attributes = match[2];
      const modifiedAt = new Date(match[4].trim());
      const isDirectory = attributes.includes('D');

      return {
        name,
        type: isDirectory ? 'folder' : 'file',
        size: isDirectory ? null : Number(match[3]),
        modifiedAt: Number.isNaN(modifiedAt.getTime())
          ? new Date(0).toISOString()
          : modifiedAt.toISOString(),
        extension: isDirectory
          ? null
          : name.includes('.')
            ? `.${name.split('.').at(-1)!.toLowerCase()}`
            : '',
      };
    });
}

function sharedEnvironment(password: string) {
  return { ...process.env, PASSWD: password };
}

export async function listSharedSmbItems(
  uncPath: string,
  username: string,
  password: string,
  relativePath: string,
) {
  const parsed = parseUncPath(uncPath);
  if (!parsed) throw new Error('Invalid UNC path.');
  const remotePath = safeRemotePath(relativePath);
  const command = remotePath ? `cd "${remotePath}";ls` : 'ls';
  const { stdout } = await execFileAsync(
    'smbclient',
    [`//${parsed.host}/${parsed.share}`, '-U', username, '-c', command],
    {
      env: sharedEnvironment(password),
      timeout: 15000,
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  return parseList(stdout).map((item) => ({
    ...item,
    path: [
      relativePath.replaceAll('\\', '/').replace(/^\/+|\/+$/g, ''),
      item.name,
    ]
      .filter(Boolean)
      .join('/'),
  }));
}

export async function downloadSharedSmbFile(
  uncPath: string,
  username: string,
  password: string,
  relativePath: string,
  destination: string,
) {
  const parsed = parseUncPath(uncPath);
  if (!parsed) throw new Error('Invalid UNC path.');
  const remotePath = safeRemotePath(relativePath);
  if (!remotePath) throw new Error('SMB file path is required.');
  await execFileAsync(
    'smbclient',
    [
      `//${parsed.host}/${parsed.share}`,
      '-U',
      username,
      '-c',
      `get "${remotePath}" "${destination}"`,
    ],
    {
      env: sharedEnvironment(password),
      timeout: 30 * 60 * 1000,
      maxBuffer: 1024 * 1024,
    },
  );
}

export async function uploadSharedSmbFile(
  uncPath: string,
  username: string,
  password: string,
  localPath: string,
  relativePath: string,
) {
  const parsed = parseUncPath(uncPath);
  if (!parsed) throw new Error('Invalid UNC path.');
  const remotePath = safeRemotePath(relativePath);
  const segments = remotePath.split('\\');
  const filename = segments.pop();
  if (!filename) throw new Error('SMB destination is required.');
  const mkdirCommands = segments
    .map((_, index) => `mkdir "${segments.slice(0, index + 1).join('\\')}"`)
    .join(';');
  const command = [
    mkdirCommands,
    `put "${localPath}" "${remotePath}"`,
  ]
    .filter(Boolean)
    .join(';');
  await execFileAsync(
    'smbclient',
    [`//${parsed.host}/${parsed.share}`, '-U', username, '-c', command],
    {
      env: sharedEnvironment(password),
      timeout: 30 * 60 * 1000,
      maxBuffer: 1024 * 1024,
    },
  );
}

export async function listKerberosSmbItems(
  uncPath: string,
  username: string,
  relativePath: string,
) {
  const parsed = parseUncPath(uncPath);
  if (!parsed) throw new Error('Invalid UNC path.');

  const cachePath = `/tmp/agtps-smb-${randomUUID()}`;
  const cacheName = `FILE:${cachePath}`;
  const principal = process.env.KERBEROS_SERVICE_PRINCIPAL;
  if (!principal) throw new Error('Kerberos service principal is not configured.');

  const env = {
    ...process.env,
    KRB5CCNAME: cacheName,
    KRB5_CONFIG: '/etc/krb5.conf',
    KRB5_KTNAME: '/etc/krb5.keytab',
  };

  try {
    await execFileAsync(
      'kinit',
      ['-k', '-t', '/etc/krb5.keytab', principal],
      { env, timeout: 5000 },
    );
    await execFileAsync(
      'kvno',
      ['-U', normalizeUsername(username), '-P', `cifs/${parsed.host}`],
      { env, timeout: 5000 },
    );

    const remotePath = safeRemotePath(relativePath);
    const command = remotePath ? `cd "${remotePath}";ls` : 'ls';
    const { stdout } = await execFileAsync(
      'smbclient',
      [`//${parsed.host}/${parsed.share}`, '-N', '--use-kerberos=required', '-c', command],
      { env, timeout: 15000, maxBuffer: 10 * 1024 * 1024 },
    );

    return parseList(stdout).map((item) => ({
      ...item,
      path: [relativePath.replaceAll('\\', '/').replace(/^\/+|\/+$/g, ''), item.name]
        .filter(Boolean)
        .join('/'),
    }));
  } finally {
    await execFileAsync('kdestroy', ['-c', cacheName], { env, timeout: 2000 }).catch(
      () => undefined,
    );
  }
}

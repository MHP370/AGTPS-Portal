import { promises as dns } from 'dns';
import { existsSync } from 'fs';
import { isIP, Socket } from 'net';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface SmbConnectionResult {
  path: string;
  host: string | null;
  share: string | null;
  reachable: boolean;
  kerberosReady: boolean;
  checkedAt: string;
  message: string;
}

export function parseUncPath(value: string) {
  const normalized = value.trim().replaceAll("/", "\\");
  const match = normalized.match(/^\\\\([^\\]+)\\([^\\]+)(?:\\(.*))?$/);
  if (!match) return null;
  return { host: match[1], share: match[2], subPath: match[3] ?? "" };
}

function checkPort(host: string, port: number, timeoutMs = 5000) {
  return new Promise<boolean>((resolve) => {
    const socket = new Socket();
    const finish = (ok: boolean) => { socket.destroy(); resolve(ok); };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

async function checkKerberos(host: string) {
  if (!existsSync('/etc/krb5.conf') || !existsSync('/etc/krb5.keytab')) return false;
  const principal = process.env.KERBEROS_SERVICE_PRINCIPAL;
  if (!principal) return false;
  const cache = `/tmp/agtps-smb-check-${process.pid}-${Date.now()}`;
  const env = { ...process.env, KRB5_CONFIG: '/etc/krb5.conf', KRB5_KTNAME: '/etc/krb5.keytab', KRB5CCNAME: `FILE:${cache}` };
  try {
    await execFileAsync('kinit', ['-k', '-t', '/etc/krb5.keytab', principal], { env, timeout: 5000 });
    await execFileAsync('kvno', [`cifs/${host}`], { env, timeout: 5000 });
    return true;
  } catch {
    return false;
  } finally {
    await execFileAsync('kdestroy', ['-c', `FILE:${cache}`], { env, timeout: 2000 }).catch(() => undefined);
  }
}

export async function testSmbConnection(path: string): Promise<SmbConnectionResult> {
  const checkedAt = new Date().toISOString();
  const parsed = parseUncPath(path);
  if (!parsed) return { path, host: null, share: null, reachable: false, kerberosReady: false, checkedAt, message: "مسیر باید به شکل \\\\server\\share باشد." };
  try { await dns.lookup(parsed.host); } catch { return { path, host: parsed.host, share: parsed.share, reachable: false, kerberosReady: false, checkedAt, message: "نام DNS قابل Resolve نیست." }; }
  const reachable = await checkPort(parsed.host, 445);
  const kerberosReady = reachable && !isIP(parsed.host) && await checkKerberos(parsed.host);
  const message = !reachable ? "پورت SMB در دسترس نیست." : isIP(parsed.host) ? "SMB در دسترس است؛ برای Kerberos باید نام DNS وارد شود." : kerberosReady ? "اتصال شبکه و Kerberos حساب سرویس تأیید شد." : "SMB در دسترس است، اما دریافت Ticket سرویس CIFS ناموفق بود.";
  return { path, host: parsed.host, share: parsed.share, reachable, kerberosReady, checkedAt, message };
}

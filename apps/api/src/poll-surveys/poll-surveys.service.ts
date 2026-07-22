import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PollSurveyQuestionType,
  PollSurveyParticipationMode,
  PollSurveyResponseStatus,
  PollSurveyStatus,
  PollSurveyType,
  Prisma,
} from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePollSurveyDto } from './dto/create-poll-survey.dto';
import { SubmitPollSurveyResponseDto } from './dto/submit-poll-survey-response.dto';
import { UpdatePollSurveyDto } from './dto/update-poll-survey.dto';

const pollSurveyInclude = {
  questions: {
    include: {
      options: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
    orderBy: {
      sortOrder: 'asc',
    },
  },
  responses: {
    include: {
      answers: true,
      user: true,
      directoryUser: true,
    },
  },
  participations: {
    include: {
      user: true,
      directoryUser: true,
    },
    orderBy: {
      participatedAt: 'desc',
    },
  },
} satisfies Prisma.PollSurveyInclude;

const publicPollSurveyInclude = {
  questions: {
    include: {
      options: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
    orderBy: {
      sortOrder: 'asc',
    },
  },
} satisfies Prisma.PollSurveyInclude;

type PollSurveyWithResponses = Prisma.PollSurveyGetPayload<{
  include: typeof pollSurveyInclude;
}>;

type PublicPollSurvey = Prisma.PollSurveyGetPayload<{
  include: typeof publicPollSurveyInclude;
}>;

function parseDate(value?: string | null) {
  return value ? new Date(value) : null;
}

function participantHash(pollSurveyId: string, participantKey: string) {
  return createHash('sha256')
    .update(`${pollSurveyId}:${participantKey}`)
    .digest('hex');
}

function jsonInput(value?: Record<string, unknown>) {
  return value as Prisma.InputJsonValue | undefined;
}

function buildQuestionCreate(dto: CreatePollSurveyDto) {
  if (dto.questions?.length) {
    return dto.questions.map((question, index) => ({
      type: question.type,
      title: question.title,
      description: question.description,
      isRequired: question.isRequired ?? false,
      sortOrder: question.sortOrder ?? index + 1,
      settings: jsonInput(question.settings),
      conditionQuestionId: question.conditionQuestionId,
      conditionOperator: question.conditionOperator,
      conditionValue: question.conditionValue,
      options: question.options?.length
        ? {
            create: question.options.map((option, optionIndex) => ({
              label: option.label,
              value: option.value,
              sortOrder: option.sortOrder ?? optionIndex + 1,
            })),
          }
        : undefined,
    }));
  }

  if (dto.type === PollSurveyType.POLL && dto.options?.length) {
    return [
      {
        type: dto.allowMultipleSelection
          ? PollSurveyQuestionType.MULTIPLE_CHOICE
          : PollSurveyQuestionType.SINGLE_CHOICE,
        title: dto.title,
        isRequired: true,
        sortOrder: 1,
        options: {
          create: dto.options.map((option, index) => ({
            label: option.label,
            value: option.value,
            sortOrder: option.sortOrder ?? index + 1,
          })),
        },
      },
    ];
  }

  return [];
}

function hasSubmittedResponses(item: PollSurveyWithResponses) {
  return item.responses.some(
    (response) => response.status === PollSurveyResponseStatus.SUBMITTED,
  );
}

function answerHasValue(answer: SubmitPollSurveyResponseDto['answers'][number]) {
  return Boolean(
    answer.optionId ||
      answer.optionIds?.length ||
      answer.textValue?.trim() ||
      answer.numberValue !== undefined ||
      answer.dateValue ||
      answer.booleanValue !== undefined ||
      answer.matrixValue,
  );
}

function assertSensitiveFieldsAreLocked(
  item: PollSurveyWithResponses,
  dto: UpdatePollSurveyDto,
) {
  if (!hasSubmittedResponses(item)) return;

  const lockedFields: string[] = [];

  if (dto.type !== undefined && dto.type !== item.type) {
    lockedFields.push('type');
  }

  if (dto.anonymous !== undefined && dto.anonymous !== item.anonymous) {
    lockedFields.push('anonymous');
  }

  if (
    dto.participationMode !== undefined &&
    dto.participationMode !== item.participationMode
  ) {
    lockedFields.push('participationMode');
  }

  if (
    dto.allowMultipleSelection !== undefined &&
    dto.allowMultipleSelection !== item.allowMultipleSelection
  ) {
    lockedFields.push('allowMultipleSelection');
  }

  if (dto.questions !== undefined || dto.options !== undefined) {
    lockedFields.push('questions/options');
  }

  if (
    dto.allowVoteEditing !== undefined &&
    dto.allowVoteEditing !== item.allowVoteEditing
  ) {
    lockedFields.push('allowVoteEditing');
  }

  if (
    dto.participantVisibility !== undefined &&
    dto.participantVisibility !== item.participantVisibility
  ) {
    lockedFields.push('participantVisibility');
  }

  if (lockedFields.length > 0) {
    throw new BadRequestException(
      `Sensitive fields cannot be changed after participation starts: ${lockedFields.join(', ')}`,
    );
  }
}

function sanitizePollSurveyForAdmin(item: PollSurveyWithResponses) {
  if (item.participationMode === PollSurveyParticipationMode.IDENTIFIED) {
    return item;
  }

  return {
    ...item,
    participations:
      item.participationMode === PollSurveyParticipationMode.ANONYMOUS_TRACKED
        ? item.participations
        : [],
    responses: item.responses.map((response) => ({
      ...response,
      userId: null,
      directoryUserId: null,
      participantHash: '',
      user: null,
      directoryUser: null,
    })),
  };
}

@Injectable()
export class PollSurveysService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(
    type?: PollSurveyType,
    participantKey?: string,
    currentUser?: { id?: string } | null,
  ) {
    const now = new Date();

    const items = await this.prisma.pollSurvey.findMany({
      where: {
        ...(type ? { type } : {}),
        OR: [
          {
            status: PollSurveyStatus.RUNNING,
          },
          {
            status: PollSurveyStatus.SCHEDULED,
            OR: [
              {
                publishDate: null,
              },
              {
                publishDate: {
                  lte: now,
                },
              },
            ],
          },
        ],
      },
      include: publicPollSurveyInclude,
      orderBy: [
        {
          required: 'desc',
        },
        {
          publishDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    const trackedPollIds = currentUser?.id
      ? new Set(
          (
            await this.prisma.pollSurveyParticipation.findMany({
              where: {
                userId: currentUser.id,
                pollSurveyId: { in: items.map((item) => item.id) },
              },
              select: { pollSurveyId: true },
            })
          ).map((participation) => participation.pollSurveyId),
        )
      : new Set<string>();

    const submittedHashes = new Set(
      participantKey
        ? await this.findSubmittedHashesForParticipant(items, participantKey)
        : [],
    );

    return items.map((item) => ({
      ...item,
      hasSubmitted:
        trackedPollIds.has(item.id) ||
        Boolean(
          participantKey &&
            submittedHashes.has(participantHash(item.id, participantKey)),
        ),
    }));
  }

  async findAllForAdmin(type?: PollSurveyType) {
    const items = await this.prisma.pollSurvey.findMany({
      where: type ? { type } : undefined,
      include: pollSurveyInclude,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return items.map(sanitizePollSurveyForAdmin);
  }

  async findOne(id: string) {
    const item = await this.prisma.pollSurvey.findUnique({
      where: { id },
      include: publicPollSurveyInclude,
    });

    if (!item) {
      throw new NotFoundException('Poll or survey was not found.');
    }

    return item;
  }

  async getPublicResults(id: string) {
    const item = await this.findOneForAdmin(id);

    if (!item.allowResultViewing && !item.allowLiveResults) {
      throw new BadRequestException('Results are not visible for this item.');
    }

    return this.buildResults(item, {
      includeTextAnswers: false,
      includeParticipants: false,
    });
  }

  async findOneForAdmin(id: string) {
    const item = await this.prisma.pollSurvey.findUnique({
      where: { id },
      include: pollSurveyInclude,
    });

    if (!item) {
      throw new NotFoundException('Poll or survey was not found.');
    }

    return sanitizePollSurveyForAdmin(item);
  }

  create(dto: CreatePollSurveyDto, creatorId?: string) {
    return this.prisma.pollSurvey.create({
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        tags: dto.tags ?? [],
        allowMultipleSelection: dto.allowMultipleSelection ?? false,
        anonymous:
          dto.participationMode !== undefined
            ? dto.participationMode !== PollSurveyParticipationMode.IDENTIFIED
            : dto.anonymous ?? false,
        participationMode:
          dto.participationMode ??
          (dto.anonymous
            ? PollSurveyParticipationMode.ANONYMOUS_FULL
            : PollSurveyParticipationMode.IDENTIFIED),
        required: dto.required ?? false,
        popupEnforced: dto.popupEnforced ?? false,
        allowVoteEditing: dto.allowVoteEditing ?? false,
        deadline: parseDate(dto.deadline),
        publishDate: parseDate(dto.publishDate),
        status: dto.status ?? PollSurveyStatus.DRAFT,
        targetUserIds: dto.targetUserIds ?? [],
        targetDepartments: dto.targetDepartments ?? [],
        targetAdGroupIds: dto.targetAdGroupIds ?? [],
        allowResultViewing: dto.allowResultViewing ?? false,
        allowParticipantCount: dto.allowParticipantCount ?? true,
        allowLiveResults: dto.allowLiveResults ?? false,
        participantVisibility:
          dto.participationMode !== undefined
            ? dto.participationMode ===
              PollSurveyParticipationMode.ANONYMOUS_TRACKED
            : dto.participantVisibility ?? false,
        creatorId,
        questions: {
          create: buildQuestionCreate(dto),
        },
      },
      include: pollSurveyInclude,
    });
  }

  async update(id: string, dto: UpdatePollSurveyDto) {
    const current = await this.findOneForAdmin(id);
    assertSensitiveFieldsAreLocked(current, dto);
    const shouldReplaceQuestions =
      dto.questions !== undefined || dto.options !== undefined;

    return this.prisma.$transaction(async (tx) => {
      if (shouldReplaceQuestions) {
        await tx.pollSurveyQuestion.deleteMany({
          where: {
            pollSurveyId: id,
          },
        });
      }

      return tx.pollSurvey.update({
        where: { id },
        data: {
          ...(dto.type && { type: dto.type }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.category !== undefined && { category: dto.category }),
          ...(dto.tags !== undefined && { tags: dto.tags }),
          ...(dto.allowMultipleSelection !== undefined && {
            allowMultipleSelection: dto.allowMultipleSelection,
          }),
          ...(dto.anonymous !== undefined && { anonymous: dto.anonymous }),
          ...(dto.participationMode !== undefined && {
            participationMode: dto.participationMode,
            anonymous:
              dto.participationMode !== PollSurveyParticipationMode.IDENTIFIED,
            participantVisibility:
              dto.participationMode ===
              PollSurveyParticipationMode.ANONYMOUS_TRACKED,
          }),
          ...(dto.required !== undefined && { required: dto.required }),
          ...(dto.popupEnforced !== undefined && {
            popupEnforced: dto.popupEnforced,
          }),
          ...(dto.allowVoteEditing !== undefined && {
            allowVoteEditing: dto.allowVoteEditing,
          }),
          ...(dto.deadline !== undefined && {
            deadline: parseDate(dto.deadline),
          }),
          ...(dto.publishDate !== undefined && {
            publishDate: parseDate(dto.publishDate),
          }),
          ...(dto.status && { status: dto.status }),
          ...(dto.targetUserIds !== undefined && {
            targetUserIds: dto.targetUserIds,
          }),
          ...(dto.targetDepartments !== undefined && {
            targetDepartments: dto.targetDepartments,
          }),
          ...(dto.targetAdGroupIds !== undefined && {
            targetAdGroupIds: dto.targetAdGroupIds,
          }),
          ...(dto.allowResultViewing !== undefined && {
            allowResultViewing: dto.allowResultViewing,
          }),
          ...(dto.allowParticipantCount !== undefined && {
            allowParticipantCount: dto.allowParticipantCount,
          }),
          ...(dto.allowLiveResults !== undefined && {
            allowLiveResults: dto.allowLiveResults,
          }),
          ...(dto.participantVisibility !== undefined && {
            participantVisibility: dto.participantVisibility,
          }),
          ...(shouldReplaceQuestions && {
            questions: {
              create: buildQuestionCreate(dto as CreatePollSurveyDto),
            },
          }),
        },
        include: pollSurveyInclude,
      });
    });
  }

  remove(id: string) {
    return this.prisma.pollSurvey.delete({
      where: { id },
    });
  }

  async clone(id: string, creatorId?: string) {
    const current = await this.findOneForAdmin(id);

    return this.prisma.pollSurvey.create({
      data: {
        type: current.type,
        title: `${current.title} - کپی`,
        description: current.description,
        category: current.category,
        tags: current.tags,
        allowMultipleSelection: current.allowMultipleSelection,
        anonymous: current.anonymous,
        participationMode: current.participationMode,
        required: false,
        popupEnforced: false,
        allowVoteEditing: current.allowVoteEditing,
        deadline: null,
        publishDate: null,
        status: PollSurveyStatus.DRAFT,
        targetUserIds: current.targetUserIds,
        targetDepartments: current.targetDepartments,
        targetAdGroupIds: current.targetAdGroupIds,
        allowResultViewing: current.allowResultViewing,
        allowParticipantCount: current.allowParticipantCount,
        allowLiveResults: current.allowLiveResults,
        participantVisibility: current.participantVisibility,
        creatorId,
        questions: {
          create: current.questions.map((question) => ({
            type: question.type,
            title: question.title,
            description: question.description,
            isRequired: question.isRequired,
            sortOrder: question.sortOrder,
            settings: question.settings as Prisma.InputJsonValue,
            conditionQuestionId: question.conditionQuestionId,
            conditionOperator: question.conditionOperator,
            conditionValue: question.conditionValue,
            options: {
              create: question.options.map((option) => ({
                label: option.label,
                value: option.value,
                sortOrder: option.sortOrder,
              })),
            },
          })),
        },
      },
      include: pollSurveyInclude,
    });
  }

  async submitResponse(
    id: string,
    dto: SubmitPollSurveyResponseDto,
    currentUser: {
      id?: string;
      directoryUserId?: string | null;
    } | null,
  ) {
    const item = await this.findOneForAdmin(id);
    const now = new Date();

    if (
      item.status === PollSurveyStatus.CLOSED ||
      item.status === PollSurveyStatus.ARCHIVED
    ) {
      throw new BadRequestException('This poll or survey is closed.');
    }

    if (item.deadline && item.deadline < now) {
      throw new BadRequestException('The deadline has passed.');
    }

    const requiresIdentity =
      item.participationMode !== PollSurveyParticipationMode.ANONYMOUS_FULL;

    if (requiresIdentity && !currentUser?.id) {
      throw new BadRequestException(
        'برای شرکت در این رأی‌گیری باید وارد پورتال شوید.',
      );
    }

    const responseParticipantKey =
      item.participationMode === PollSurveyParticipationMode.IDENTIFIED &&
      currentUser?.id
        ? `user:${currentUser.id}`
        : dto.participantKey;
    const hash = participantHash(id, responseParticipantKey);
    const existing = await this.prisma.pollSurveyResponse.findUnique({
      where: {
        pollSurveyId_participantHash: {
          pollSurveyId: id,
          participantHash: hash,
        },
      },
    });

    if (
      existing?.status === PollSurveyResponseStatus.SUBMITTED &&
      !item.allowVoteEditing
    ) {
      throw new BadRequestException('You have already submitted a response.');
    }

    const existingParticipation = currentUser?.id
      ? await this.prisma.pollSurveyParticipation.findUnique({
          where: {
            pollSurveyId_userId: {
              pollSurveyId: id,
              userId: currentUser.id,
            },
          },
        })
      : null;

    if (
      item.participationMode ===
        PollSurveyParticipationMode.ANONYMOUS_TRACKED &&
      existingParticipation &&
      !item.allowVoteEditing
    ) {
      throw new BadRequestException('You have already submitted a response.');
    }

    const questionIds = new Set(item.questions.map((question) => question.id));
    const answersByQuestionId = new Map(
      dto.answers.map((answer) => [answer.questionId, answer]),
    );
    const invalidAnswer = dto.answers.find(
      (answer) => !questionIds.has(answer.questionId),
    );

    if (invalidAnswer) {
      throw new BadRequestException('One or more answers are invalid.');
    }

    if (!dto.saveDraft) {
      const missingRequiredQuestion = item.questions.find((question) => {
        if (!question.isRequired) return false;
        const answer = answersByQuestionId.get(question.id);
        return !answer || !answerHasValue(answer);
      });

      if (missingRequiredQuestion) {
        throw new BadRequestException('Required questions must be answered.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const response = await tx.pollSurveyResponse.upsert({
        where: {
          pollSurveyId_participantHash: {
            pollSurveyId: id,
            participantHash: hash,
          },
        },
        update: {
          userId:
            item.participationMode === PollSurveyParticipationMode.IDENTIFIED
              ? currentUser?.id
              : null,
          directoryUserId:
            item.participationMode === PollSurveyParticipationMode.IDENTIFIED
              ? currentUser?.directoryUserId
              : null,
          isAnonymous:
            item.participationMode !== PollSurveyParticipationMode.IDENTIFIED,
          status: dto.saveDraft
            ? PollSurveyResponseStatus.DRAFT
            : PollSurveyResponseStatus.SUBMITTED,
          timeSpentSeconds: dto.timeSpentSeconds,
          submittedAt: dto.saveDraft ? null : now,
        },
        create: {
          pollSurveyId: id,
          userId:
            item.participationMode === PollSurveyParticipationMode.IDENTIFIED
              ? currentUser?.id
              : null,
          directoryUserId:
            item.participationMode === PollSurveyParticipationMode.IDENTIFIED
              ? currentUser?.directoryUserId
              : null,
          participantHash: hash,
          isAnonymous:
            item.participationMode !== PollSurveyParticipationMode.IDENTIFIED,
          status: dto.saveDraft
            ? PollSurveyResponseStatus.DRAFT
            : PollSurveyResponseStatus.SUBMITTED,
          timeSpentSeconds: dto.timeSpentSeconds,
          submittedAt: dto.saveDraft ? null : now,
        },
      });

      await tx.pollSurveyAnswer.deleteMany({
        where: {
          responseId: response.id,
        },
      });

      await tx.pollSurveyAnswer.createMany({
        data: dto.answers.map((answer) => ({
          responseId: response.id,
          questionId: answer.questionId,
          optionId: answer.optionId,
          optionIds: answer.optionIds ?? [],
          textValue: answer.textValue,
          numberValue: answer.numberValue,
          dateValue: answer.dateValue ? new Date(answer.dateValue) : null,
          booleanValue: answer.booleanValue,
          matrixValue: jsonInput(answer.matrixValue),
        })),
      });

      if (!dto.saveDraft && requiresIdentity && currentUser?.id) {
        await tx.pollSurveyParticipation.upsert({
          where: {
            pollSurveyId_userId: {
              pollSurveyId: id,
              userId: currentUser.id,
            },
          },
          update: {
            directoryUserId: currentUser.directoryUserId,
            participatedAt: now,
          },
          create: {
            pollSurveyId: id,
            userId: currentUser.id,
            directoryUserId: currentUser.directoryUserId,
            participatedAt: now,
          },
        });
      }

      return tx.pollSurveyResponse.findUnique({
        where: { id: response.id },
        include: {
          answers: true,
        },
      });
    });
  }

  async getResults(id: string) {
    const item = await this.findOneForAdmin(id);

    return this.buildResults(item, {
      includeTextAnswers: true,
      includeParticipants: true,
    });
  }

  private buildResults(
    item: PollSurveyWithResponses,
    options: {
      includeTextAnswers: boolean;
      includeParticipants: boolean;
    },
  ) {
    const submittedResponses = item.responses.filter(
      (response) => response.status === PollSurveyResponseStatus.SUBMITTED,
    );
    const timelineCounts = submittedResponses.reduce<Record<string, number>>(
      (counts, response) => {
        const dateKey = (response.submittedAt ?? response.updatedAt)
          .toISOString()
          .slice(0, 10);

        counts[dateKey] = (counts[dateKey] ?? 0) + 1;
        return counts;
      },
      {},
    );
    const targetCount =
      item.targetUserIds.length > 0 ? item.targetUserIds.length : null;

    return {
      id: item.id,
      type: item.type,
      title: item.title,
      status: item.status,
      deadline: item.deadline,
      publishDate: item.publishDate,
      totalResponses: submittedResponses.length,
      targetCount,
      participationRate: targetCount
        ? (submittedResponses.length / targetCount) * 100
        : null,
      participationMode: item.participationMode,
      participants:
        !options.includeParticipants ||
        item.participationMode === PollSurveyParticipationMode.ANONYMOUS_FULL
          ? []
          : item.participationMode ===
              PollSurveyParticipationMode.ANONYMOUS_TRACKED
            ? item.participations.map((participation) => ({
                userId: participation.userId,
                directoryUserId: participation.directoryUserId,
                displayName:
                  participation.directoryUser?.displayName ||
                  [
                    participation.user.firstName,
                    participation.user.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ') ||
                  participation.user.username,
                username:
                  participation.directoryUser?.username ||
                  participation.user.username,
                participatedAt: participation.participatedAt,
              }))
            : submittedResponses.map((response) => ({
                userId: response.userId,
                directoryUserId: response.directoryUserId,
                displayName:
                  response.directoryUser?.displayName ||
                  [response.user?.firstName, response.user?.lastName]
                    .filter(Boolean)
                    .join(' ') ||
                  response.user?.username ||
                  'کاربر نامشخص',
                username:
                  response.directoryUser?.username ||
                  response.user?.username ||
                  '-',
                participatedAt: response.submittedAt ?? response.updatedAt,
              })),
      timeline: Object.entries(timelineCounts)
        .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
        .map(([date, count]) => ({
          date,
          count,
        })),
      questions: item.questions.map((question) => {
        const answers = submittedResponses.flatMap((response) =>
          response.answers.filter(
            (answer) => answer.questionId === question.id,
          ),
        );

        return {
          id: question.id,
          title: question.title,
          type: question.type,
          totalAnswers: answers.length,
          options: question.options.map((option) => ({
            id: option.id,
            label: option.label,
            count: answers.filter(
              (answer) =>
                answer.optionId === option.id ||
                answer.optionIds.includes(option.id),
            ).length,
          })).map((option, _index, allOptions) => {
            const totalOptionVotes = allOptions.reduce(
              (sum, current) => sum + current.count,
              0,
            );

            return {
              ...option,
              percent: totalOptionVotes
                ? (option.count / totalOptionVotes) * 100
                : 0,
            };
          }),
          textAnswers:
            options.includeTextAnswers &&
            (question.type === PollSurveyQuestionType.TEXT ||
              question.type === PollSurveyQuestionType.PARAGRAPH)
              ? answers
                  .map((answer) => answer.textValue)
                  .filter((value): value is string => Boolean(value))
              : [],
          average:
            question.type === PollSurveyQuestionType.RATING ||
            question.type === PollSurveyQuestionType.NUMBER
              ? answers.reduce(
                  (sum, answer) => sum + (answer.numberValue ?? 0),
                  0,
                ) / Math.max(answers.length, 1)
              : null,
        };
      }),
    };
  }

  private async findSubmittedHashesForParticipant(
    items: PublicPollSurvey[],
    participantKey: string,
  ) {
    if (!items.length) return [];

    const hashByItemId = new Map(
      items.map((item) => [item.id, participantHash(item.id, participantKey)]),
    );

    const responses = await this.prisma.pollSurveyResponse.findMany({
      where: {
        status: PollSurveyResponseStatus.SUBMITTED,
        OR: Array.from(hashByItemId, ([pollSurveyId, hash]) => ({
          pollSurveyId,
          participantHash: hash,
        })),
      },
      select: {
        participantHash: true,
      },
    });

    return responses.map((response) => response.participantHash);
  }
}

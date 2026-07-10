import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PollSurveyQuestionType,
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
    },
  },
} satisfies Prisma.PollSurveyInclude;

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

@Injectable()
export class PollSurveysService {
  constructor(private readonly prisma: PrismaService) {}

  findPublic(type?: PollSurveyType) {
    return this.prisma.pollSurvey.findMany({
      where: {
        ...(type ? { type } : {}),
        status: {
          in: [PollSurveyStatus.SCHEDULED, PollSurveyStatus.RUNNING],
        },
      },
      include: pollSurveyInclude,
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
  }

  findAllForAdmin(type?: PollSurveyType) {
    return this.prisma.pollSurvey.findMany({
      where: type ? { type } : undefined,
      include: pollSurveyInclude,
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.pollSurvey.findUnique({
      where: { id },
      include: pollSurveyInclude,
    });

    if (!item) {
      throw new NotFoundException('Poll or survey was not found.');
    }

    return item;
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
        anonymous: dto.anonymous ?? false,
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
        participantVisibility: dto.participantVisibility ?? false,
        creatorId,
        questions: {
          create: buildQuestionCreate(dto),
        },
      },
      include: pollSurveyInclude,
    });
  }

  async update(id: string, dto: UpdatePollSurveyDto) {
    await this.findOne(id);
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

  async submitResponse(id: string, dto: SubmitPollSurveyResponseDto) {
    const item = await this.findOne(id);
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

    const hash = participantHash(id, dto.participantKey);
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

    return this.prisma.$transaction(async (tx) => {
      const response = await tx.pollSurveyResponse.upsert({
        where: {
          pollSurveyId_participantHash: {
            pollSurveyId: id,
            participantHash: hash,
          },
        },
        update: {
          userId: item.anonymous ? null : dto.userId,
          directoryUserId: item.anonymous ? null : dto.directoryUserId,
          isAnonymous: item.anonymous,
          status: dto.saveDraft
            ? PollSurveyResponseStatus.DRAFT
            : PollSurveyResponseStatus.SUBMITTED,
          timeSpentSeconds: dto.timeSpentSeconds,
          submittedAt: dto.saveDraft ? null : now,
        },
        create: {
          pollSurveyId: id,
          userId: item.anonymous ? null : dto.userId,
          directoryUserId: item.anonymous ? null : dto.directoryUserId,
          participantHash: hash,
          isAnonymous: item.anonymous,
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

      return tx.pollSurveyResponse.findUnique({
        where: { id: response.id },
        include: {
          answers: true,
        },
      });
    });
  }

  async getResults(id: string) {
    const item = await this.findOne(id);
    const submittedResponses = item.responses.filter(
      (response) => response.status === PollSurveyResponseStatus.SUBMITTED,
    );

    return {
      id: item.id,
      type: item.type,
      title: item.title,
      totalResponses: submittedResponses.length,
      participationRate: null,
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
          })),
          textAnswers:
            question.type === PollSurveyQuestionType.TEXT ||
            question.type === PollSurveyQuestionType.PARAGRAPH
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
}

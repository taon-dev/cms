import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon, TaonBaseAngularService } from 'taon/src';

import type { TaonCmsCommentEntity } from './taon-cms-comment.entity';
import {
  TaonCmsCommentController,
  type CommentListItem,
} from './taon-cms-comment.controller';

@Injectable()
export class TaonCmsCommentApiService extends TaonBaseAngularService {
  protected readonly taonCmsCommentController = this.injectController(
    TaonCmsCommentController,
  );

  async getComments(contentId: number): Promise<CommentListItem[]> {
    const response =
      await this.taonCmsCommentController.getComments(contentId).request!();
    if (response.statusCode >= 400) {
      throw new Error(response.responseText || 'Unable to load comments.');
    }
    return response.body?.json ?? [];
  }

  async createComment(
    contentId: number,
    body: string,
  ): Promise<CommentListItem> {
    const response = await this.taonCmsCommentController.createComment({
      contentId,
      body,
    }).request!();
    if (response.statusCode >= 400 || !response.body?.json) {
      throw new Error(response.responseText || 'Unable to add the comment.');
    }
    return response.body.json;
  }

  async deleteComment(id: number): Promise<void> {
    const response =
      await this.taonCmsCommentController.deleteComment(id).request!();
    if (response.statusCode >= 400) {
      throw new Error(response.responseText || 'Unable to delete the comment.');
    }
  }

  async vote(id: number, value: -1 | 1): Promise<CommentListItem> {
    const response = await this.taonCmsCommentController.voteComment({
      commentId: id,
      value,
    }).request!();
    if (response.statusCode >= 400 || !response.body?.json) {
      throw new Error(
        response.responseText || 'Unable to vote on the comment.',
      );
    }
    return response.body.json;
  }

  async reportSpam(id: number): Promise<void> {
    const response =
      await this.taonCmsCommentController.reportSpam(id).request!();
    if (response.statusCode >= 400) {
      throw new Error(response.responseText || 'Unable to report the comment.');
    }
  }

  async getCommentsBackoffice(filters: {
    pageNumber: number;
    pageSize: number;
    id?: string;
    text?: string;
    author?: string;
  }): Promise<{ items: CommentListItem[]; total: number }> {
    const response = await this.taonCmsCommentController.getCommentsBackoffice(
      filters.pageNumber,
      filters.pageSize,
      filters.id,
      filters.text,
      filters.author,
    ).request!();
    if (response.statusCode >= 400 || !response.body?.json) {
      throw new Error(response.responseText || 'Unable to load CMS comments.');
    }
    return response.body.json;
  }

  async getBlockedUsers(): Promise<{ id: number; userId: number }[]> {
    const response =
      await this.taonCmsCommentController.getBlockedUsers().request!();
    if (response.statusCode >= 400) {
      throw new Error(response.responseText || 'Unable to load blocked users.');
    }
    return response.body?.json ?? [];
  }

  async setBlockedUser(userId: number, blocked: boolean): Promise<void> {
    const response = await this.taonCmsCommentController.setBlockedUser({
      userId,
      blocked,
    }).request!();
    if (response.statusCode >= 400) {
      throw new Error(
        response.responseText || 'Unable to update comment access.',
      );
    }
  }

  async getBlockedPhrases(): Promise<{ id: number; phrase: string }[]> {
    const response =
      await this.taonCmsCommentController.getBlockedPhrases().request!();
    if (response.statusCode >= 400) {
      throw new Error(
        response.responseText || 'Unable to load blocked phrases.',
      );
    }
    return response.body?.json ?? [];
  }

  async addBlockedPhrase(phrase: string): Promise<void> {
    const response =
      await this.taonCmsCommentController.addBlockedPhrase(phrase).request!();
    if (response.statusCode >= 400) {
      throw new Error(
        response.responseText || 'Unable to add the blocked phrase.',
      );
    }
  }

  async deleteBlockedPhrase(id: number): Promise<void> {
    const response =
      await this.taonCmsCommentController.deleteBlockedPhrase(id).request!();
    if (response.statusCode >= 400) {
      throw new Error(
        response.responseText || 'Unable to delete the blocked phrase.',
      );
    }
  }

  public get allMyEntities$(): Observable<TaonCmsCommentEntity[]> {
    return this.taonCmsCommentController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }
}

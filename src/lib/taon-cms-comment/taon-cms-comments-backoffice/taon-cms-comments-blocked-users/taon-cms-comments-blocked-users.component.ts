import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TaonCmsCommentApiService } from '../../taon-cms-comment-api.service';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'app-taon-cms-comments-blocked-users',
  templateUrl: './taon-cms-comments-blocked-users.component.html',
  styleUrls: ['./taon-cms-comments-blocked-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule],
  providers: [TaonCmsCommentApiService],
})
export class TaonCmsBlockedUsersBackofficeComponent implements OnInit {
  readonly t = t.for(this);

  private readonly api = inject(TaonCmsCommentApiService);

  readonly blockedUsers = signal<{ id: number; userId: number }[]>([]);

  readonly userId = signal('');

  readonly page = signal(1);

  readonly pageSize = 10;

  readonly error = signal('');

  readonly loading = signal(false);

  ngOnInit(): void {
    void this.reload();
  }

  get visibleUsers(): { id: number; userId: number }[] {
    const start = (this.page() - 1) * this.pageSize;
    return this.blockedUsers().slice(start, start + this.pageSize);
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.blockedUsers.set(await this.api.getBlockedUsers());
    } catch (error) {
      console.error('[cms-comment-blocked-users] Unable to load users', error);
      this.error.set(error instanceof Error ? error.message : this.t.gettext('Blocked users could not be loaded.'));
    } finally {
      this.loading.set(false);
    }
  }

  async block(): Promise<void> {
    const id = Number(this.userId());
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.error.set(this.t.gettext('Enter a valid user ID.'));
      return;
    }
    await this.change(id, true);
  }

  async unblock(userId: number): Promise<void> {
    await this.change(userId, false);
  }

  async changePage(amount: number): Promise<void> {
    const next = this.page() + amount;
    const max = Math.max(1, Math.ceil(this.blockedUsers().length / this.pageSize));
    if (next >= 1 && next <= max) {
      this.page.set(next);
    }
  }

  private async change(userId: number, blocked: boolean): Promise<void> {
    this.error.set('');
    try {
      await this.api.setBlockedUser(userId, blocked);
      this.userId.set('');
      await this.reload();
    } catch (error) {
      console.error('[cms-comment-blocked-users] Unable to change user status', error);
      this.error.set(error instanceof Error ? error.message : this.t.gettext('Comment access could not be updated.'));
    }
  }
}
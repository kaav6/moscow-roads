import { Module } from '@nestjs/common';
import { FeedModule } from '../feed/feed.module';
import { MockService } from './mock.service';

@Module({
  imports: [FeedModule],
  providers: [MockService],
})
export class MockModule {}

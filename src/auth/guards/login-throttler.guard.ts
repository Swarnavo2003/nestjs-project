/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const email = req.body?.email || 'anonymous';
    return `login-${email}`;
  }

  // set limit to 5 attemps
  protected getLimit(): Promise<number> {
    return Promise.resolve(5);
  }

  // time window of 1 minute
  protected getTtl(): Promise<number> {
    return Promise.resolve(60 * 1000);
  }

  protected async throwThrottleException(): Promise<void> {
    throw new ThrottlerException(`Too many attempts, please try again later`);
  }
}

import { Injectable } from '@nestjs/common';
import { CounterRepository } from './counter.repository';

@Injectable()
export class CounterService {
  constructor(private readonly counterRepository: CounterRepository) {}

  /**
   * Generate the next human-readable ticket id, e.g. NV-2026-000123.
   * Sequence is per-year and incremented atomically to avoid collisions.
   */
  async nextTicketId(prefix = 'NV'): Promise<string> {
    const year = new Date().getFullYear();
    const counter = await this.counterRepository.increment(`complaint-${year}`);
    return `${prefix}-${year}-${String(counter.seq).padStart(6, '0')}`;
  }
}

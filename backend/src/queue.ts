export interface QueueJob<T> {
  id: string;
  payload: T;
  createdAt: Date;
}

export class Queue<T> {
  private jobs: QueueJob<T>[] = [];

  enqueue(job: QueueJob<T>): void {
    this.jobs.push(job);
  }

  dequeue(): QueueJob<T> | undefined {
    return this.jobs.shift();
  }

  peek(): QueueJob<T> | undefined {
    return this.jobs[0];
  }

  size(): number {
    return this.jobs.length;
  }
}

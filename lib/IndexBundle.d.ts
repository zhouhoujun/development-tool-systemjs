/// <reference types="gulp" />
import { ITaskContext, IAssertDist, Pipe, ITaskInfo, TransformSource, PipeTask } from 'development-core';
import { Gulp } from 'gulp';
export declare class IndexBundle extends PipeTask {
    constructor(info?: ITaskInfo);
    source(ctx: ITaskContext, option: IAssertDist, gulp: Gulp): TransformSource | Promise<TransformSource>;
    pipes(ctx: ITaskContext, dist: IAssertDist, gulp?: Gulp): Pipe[];
}

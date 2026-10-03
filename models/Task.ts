import mongoose, { Schema } from "mongoose";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface ITaskComment {
  user: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
}

export interface ITask {
  workspace: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  labels: string[];
  tags: string[];
  dueDate?: Date | null;
  comments: ITaskComment[];
  createdAt: Date;
  updatedAt: Date;
}

const taskCommentSchema = new Schema<ITaskComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const taskSchema = new Schema<ITask>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    labels: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    comments: {
      type: [taskCommentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ title: "text", description: "text", tags: "text" });

const Task = mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);

export default Task;

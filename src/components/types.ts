export interface User {
  id?: string | number;
  name?: string;
  age?: number;
  avatar?: string;
  status?: boolean;
  job?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface UserInput {
  name: string;
  age?: number;
  avatar: string;
  status: boolean;
  job: string;
  phone: string;
}

export interface InitialState {
  users: User[];
  loading: boolean;
  deletingUserIds: string[];
  error: string | null;
}

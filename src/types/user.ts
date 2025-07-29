// User Types for BusinessMap API

export interface User {
  user_id?: number;
  email: string;
  username: string;
  realname: string;
  avatar: string;
  is_enabled: number;
  is_confirmed: number;
  is_tfa_enabled: number;
  registration_date: string;
  timezone?: string;
  language?: string;
  attributes?: UserAttribute[];
}

export interface CurrentUser {
  user_id: number;
  email: string;
  username: string;
  realname: string;
  avatar: string;
  is_tfa_enabled: number;
  is_enabled: number;
  is_confirmed: number;
  registration_date: string;
  timezone: string;
  language: string;
}

export interface UserAttribute {
  attribute_id: number;
  value: string;
}

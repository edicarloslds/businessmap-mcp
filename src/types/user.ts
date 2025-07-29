// User Types for BusinessMap API

export interface User {
  email: string;
  username: string;
  realname: string;
  avatar: string;
  is_enabled: number;
  is_confirmed: number;
  is_tfa_enabled: number;
  registration_date: string;
  attributes: UserAttribute[];
}

export interface UserAttribute {
  attribute_id: number;
  value: string;
}

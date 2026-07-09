// Doc (documents) Types for BusinessMap API

export interface DocListItem {
  doc_id: number;
  parent_doc_id: number | null;
  title: string;
  is_archived: number;
  is_important: number;
  position: number;
  show_in_main_doc_list: number;
  updated_at: string;
  author_id: number;
  size: number;
}

export interface Doc extends DocListItem {
  content: string;
  everyone_can_edit: number;
  everyone_can_comment: number;
  everyone_can_view: number;
  created_at: string;
}

export interface DocsListData {
  result: DocListItem[];
  fully_hidden_docs?: number[];
  docs_without_owners?: number[];
}

export interface DocsListResponse {
  data: DocsListData;
}

export interface DocResponse {
  data: Doc;
}

export interface PersonalDocListItem {
  doc_id: number;
  title: string;
  position: number;
  updated_at?: string;
  size?: number;
}

export interface PersonalDoc extends PersonalDocListItem {
  content: string;
  created_at?: string;
}

export interface PersonalDocsListResponse {
  data: PersonalDocListItem[];
}

export interface PersonalDocResponse {
  data: PersonalDoc;
}

export interface BoardDocItem {
  doc_id: number;
  title: string;
  is_important: number;
  is_archived: number;
  position: number;
}

export interface BoardDocsResponse {
  data: BoardDocItem[];
}

export interface DocFilters {
  doc_ids?: number[];
  title?: string;
  is_archived?: number;
  show_in_main_doc_list?: number;
  is_important?: number;
  for_welcome?: number;
  parent_doc_ids?: number[];
}

export interface CreateDocParams {
  title: string;
  content?: string;
  is_important?: number;
  for_welcome?: number;
  is_archived?: number;
  parent_doc_id?: number;
  position?: number;
  show_in_main_doc_list?: number;
}

export interface UpdateDocParams {
  title?: string;
  content?: string;
  is_important?: number;
  for_welcome?: number;
  is_archived?: number;
  parent_doc_id?: number;
  position?: number;
}

export interface CreatePersonalDocParams {
  title: string;
  content?: string;
  position?: number;
}

export interface UpdatePersonalDocParams {
  title?: string;
  content?: string;
  position?: number;
}

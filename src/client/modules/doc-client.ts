import {
  BoardDocItem,
  BoardDocsResponse,
  CreateDocParams,
  CreatePersonalDocParams,
  Doc,
  DocFilters,
  DocListItem,
  DocResponse,
  DocsListResponse,
  PersonalDoc,
  PersonalDocListItem,
  PersonalDocResponse,
  PersonalDocsListResponse,
  UpdateDocParams,
  UpdatePersonalDocParams,
} from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export class DocClient extends BaseClientModuleImpl {
  /**
   * Get a list of docs (metadata only, no content) with optional filters
   */
  async getDocs(filters?: DocFilters): Promise<DocListItem[]> {
    const response = await this.http.get<DocsListResponse>('/docs', { params: filters || {} });
    return response.data.data.result;
  }

  /**
   * Get the details of a single doc, including its content
   */
  async getDoc(docId: number): Promise<Doc> {
    const response = await this.http.get<DocResponse>(`/docs/${docId}`);
    return response.data.data;
  }

  /**
   * Create a new doc
   */
  async createDoc(params: CreateDocParams): Promise<Doc> {
    this.checkReadOnlyMode('create doc');
    const response = await this.http.post<DocResponse>('/docs', params);
    return response.data.data;
  }

  /**
   * Update an existing doc (also used to archive/unarchive via is_archived)
   */
  async updateDoc(docId: number, params: UpdateDocParams): Promise<Doc> {
    this.checkReadOnlyMode('update doc');
    const response = await this.http.patch<DocResponse>(`/docs/${docId}`, params);
    return response.data.data;
  }

  /**
   * Get the docs pinned to a specific board
   */
  async getBoardDocs(boardId: number): Promise<BoardDocItem[]> {
    const response = await this.http.get<BoardDocsResponse>(`/boards/${boardId}/docs`);
    return response.data.data;
  }

  /**
   * Get a list of personal docs (metadata only) with optional filters
   */
  async getPersonalDocs(filters?: {
    doc_ids?: number[];
    title?: string;
  }): Promise<PersonalDocListItem[]> {
    const response = await this.http.get<PersonalDocsListResponse>('/personalDocs', {
      params: filters || {},
    });
    return response.data.data;
  }

  /**
   * Get the details of a single personal doc, including its content
   */
  async getPersonalDoc(docId: number): Promise<PersonalDoc> {
    const response = await this.http.get<PersonalDocResponse>(`/personalDocs/${docId}`);
    return response.data.data;
  }

  /**
   * Create a new personal doc
   */
  async createPersonalDoc(params: CreatePersonalDocParams): Promise<PersonalDoc> {
    this.checkReadOnlyMode('create personal doc');
    const response = await this.http.post<PersonalDocResponse>('/personalDocs', params);
    return response.data.data;
  }

  /**
   * Update an existing personal doc
   */
  async updatePersonalDoc(docId: number, params: UpdatePersonalDocParams): Promise<PersonalDoc> {
    this.checkReadOnlyMode('update personal doc');
    const response = await this.http.patch<PersonalDocResponse>(`/personalDocs/${docId}`, params);
    return response.data.data;
  }
}

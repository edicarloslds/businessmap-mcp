import {
  createDocSchema,
  getDocContentBatchSchema,
  getDocsForBoardsBatchSchema,
  listDocsSchema,
  searchDocsSchema,
  updateDocSchema,
} from './doc-schemas.js';

describe('searchDocsSchema', () => {
  it('accepts a query with optional flags', () => {
    const result = searchDocsSchema.parse({
      query: 'onboarding',
      include_archived: true,
      include_personal: true,
    });
    expect(result.query).toBe('onboarding');
    expect(result.include_archived).toBe(true);
  });

  it('rejects an empty query', () => {
    expect(() => searchDocsSchema.parse({ query: '' })).toThrow();
  });

  it('rejects a missing query', () => {
    expect(() => searchDocsSchema.parse({})).toThrow();
  });
});

describe('listDocsSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(() => listDocsSchema.parse({})).not.toThrow();
  });

  it('accepts doc_ids and parent_doc_ids arrays', () => {
    const result = listDocsSchema.parse({ doc_ids: [1, 2], parent_doc_ids: [3] });
    expect(result.doc_ids).toEqual([1, 2]);
    expect(result.parent_doc_ids).toEqual([3]);
  });
});

describe('getDocContentBatchSchema', () => {
  it('accepts up to 20 doc ids', () => {
    const result = getDocContentBatchSchema.parse({ doc_ids: [1, 2, 3], personal: true });
    expect(result.doc_ids).toHaveLength(3);
    expect(result.personal).toBe(true);
  });

  it('rejects an empty doc_ids array', () => {
    expect(() => getDocContentBatchSchema.parse({ doc_ids: [] })).toThrow();
  });

  it('rejects more than 20 doc ids', () => {
    const ids = Array.from({ length: 21 }, (_, i) => i + 1);
    expect(() => getDocContentBatchSchema.parse({ doc_ids: ids })).toThrow();
  });
});

describe('getDocsForBoardsBatchSchema', () => {
  it('accepts up to 10 board ids', () => {
    const result = getDocsForBoardsBatchSchema.parse({ board_ids: [10, 20] });
    expect(result.board_ids).toEqual([10, 20]);
  });

  it('rejects more than 10 board ids', () => {
    const ids = Array.from({ length: 11 }, (_, i) => i + 1);
    expect(() => getDocsForBoardsBatchSchema.parse({ board_ids: ids })).toThrow();
  });
});

describe('createDocSchema', () => {
  it('requires a title', () => {
    expect(() => createDocSchema.parse({})).toThrow();
    expect(() => createDocSchema.parse({ title: 'My Doc' })).not.toThrow();
  });

  it('accepts full doc creation params', () => {
    const result = createDocSchema.parse({
      title: 'Guide',
      content: '<p>Hello</p>',
      parent_doc_id: 5,
      position: 0,
      is_important: 1,
    });
    expect(result.parent_doc_id).toBe(5);
  });
});

describe('updateDocSchema', () => {
  it('requires doc_id', () => {
    expect(() => updateDocSchema.parse({ title: 'x' })).toThrow();
  });

  it('accepts partial updates', () => {
    const result = updateDocSchema.parse({ doc_id: 7, content: '<p>New</p>' });
    expect(result.doc_id).toBe(7);
    expect(result.title).toBeUndefined();
  });
});

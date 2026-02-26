import { createBoardSchema, listBoardsSchema, searchBoardSchema } from './board-schemas.js';

describe('listBoardsSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(() => listBoardsSchema.parse({})).not.toThrow();
  });

  it('accepts valid board_ids array', () => {
    const result = listBoardsSchema.parse({ board_ids: [1, 2, 3] });
    expect(result.board_ids).toEqual([1, 2, 3]);
  });

  it('accepts valid expand options', () => {
    const result = listBoardsSchema.parse({ expand: ['workflows', 'settings'] });
    expect(result.expand).toEqual(['workflows', 'settings']);
  });

  it('rejects invalid expand values', () => {
    expect(() => listBoardsSchema.parse({ expand: ['invalid_value'] })).toThrow();
  });

  it('accepts is_archived filter', () => {
    const result = listBoardsSchema.parse({ is_archived: 0 });
    expect(result.is_archived).toBe(0);
  });
});

describe('searchBoardSchema', () => {
  it('accepts object with board_id only', () => {
    const result = searchBoardSchema.parse({ board_id: 42 });
    expect(result.board_id).toBe(42);
  });

  it('accepts object with board_name only', () => {
    const result = searchBoardSchema.parse({ board_name: 'My Board' });
    expect(result.board_name).toBe('My Board');
  });

  it('accepts empty object (all fields optional)', () => {
    expect(() => searchBoardSchema.parse({})).not.toThrow();
  });

  it('accepts all fields together', () => {
    const result = searchBoardSchema.parse({
      board_id: 1,
      board_name: 'Test',
      workspace_id: 100,
    });
    expect(result.board_id).toBe(1);
    expect(result.board_name).toBe('Test');
    expect(result.workspace_id).toBe(100);
  });
});

describe('createBoardSchema', () => {
  it('requires name field', () => {
    expect(() => createBoardSchema.parse({})).toThrow();
  });

  it('accepts valid board with required name', () => {
    const result = createBoardSchema.parse({ name: 'Sprint Board' });
    expect(result.name).toBe('Sprint Board');
  });

  it('accepts optional fields', () => {
    const result = createBoardSchema.parse({
      name: 'Sprint Board',
      description: 'A sprint planning board',
      workspace_id: 5,
    });
    expect(result.description).toBe('A sprint planning board');
    expect(result.workspace_id).toBe(5);
  });

  it('rejects non-string name', () => {
    expect(() => createBoardSchema.parse({ name: 123 })).toThrow();
  });
});

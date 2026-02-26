import {
  createCardSchema,
  getCardSchema,
  listCardsSchema,
  moveCardSchema,
} from './card-schemas.js';

describe('listCardsSchema', () => {
  it('requires board_id', () => {
    expect(() => listCardsSchema.parse({})).toThrow();
  });

  it('accepts minimum valid input with board_id only', () => {
    const result = listCardsSchema.parse({ board_id: 10 });
    expect(result.board_id).toBe(10);
  });

  it('accepts optional date filters', () => {
    const result = listCardsSchema.parse({
      board_id: 10,
      created_from_date: '2024-01-01',
      created_to_date: '2024-12-31',
    });
    expect(result.created_from_date).toBe('2024-01-01');
  });

  it('accepts pagination parameters', () => {
    const result = listCardsSchema.parse({ board_id: 5, page: 2, per_page: 50 });
    expect(result.page).toBe(2);
    expect(result.per_page).toBe(50);
  });

  it('rejects non-number board_id', () => {
    expect(() => listCardsSchema.parse({ board_id: 'abc' })).toThrow();
  });

  it('accepts owner_user_ids array filter', () => {
    const result = listCardsSchema.parse({ board_id: 1, owner_user_ids: [101, 102] });
    expect(result.owner_user_ids).toEqual([101, 102]);
  });
});

describe('getCardSchema', () => {
  it('requires card_id', () => {
    expect(() => getCardSchema.parse({})).toThrow();
  });

  it('accepts valid card_id', () => {
    const result = getCardSchema.parse({ card_id: 999 });
    expect(result.card_id).toBe(999);
  });

  it('rejects non-number card_id', () => {
    expect(() => getCardSchema.parse({ card_id: 'xyz' })).toThrow();
  });
});

describe('createCardSchema', () => {
  it('requires title and column_id', () => {
    expect(() => createCardSchema.parse({})).toThrow();
    expect(() => createCardSchema.parse({ title: 'Test' })).toThrow();
    expect(() => createCardSchema.parse({ column_id: 1 })).toThrow();
  });

  it('accepts minimum valid card', () => {
    const result = createCardSchema.parse({ title: 'My Card', column_id: 5 });
    expect(result.title).toBe('My Card');
    expect(result.column_id).toBe(5);
  });

  it('accepts all optional fields', () => {
    const result = createCardSchema.parse({
      title: 'Feature Card',
      column_id: 10,
      description: 'As a user, I want...',
      owner_user_id: 42,
      size: 3,
      priority: 1,
      color: '#FF0000',
      deadline: '2025-12-31',
    });
    expect(result.description).toBe('As a user, I want...');
    expect(result.size).toBe(3);
    expect(result.color).toBe('#FF0000');
  });

  it('rejects non-string title', () => {
    expect(() => createCardSchema.parse({ title: 123, column_id: 1 })).toThrow();
  });
});

describe('moveCardSchema', () => {
  it('requires card_id and column_id', () => {
    expect(() => moveCardSchema.parse({})).toThrow();
    expect(() => moveCardSchema.parse({ card_id: 1 })).toThrow();
    expect(() => moveCardSchema.parse({ column_id: 2 })).toThrow();
  });

  it('accepts minimum valid move', () => {
    const result = moveCardSchema.parse({ card_id: 1, column_id: 5 });
    expect(result.card_id).toBe(1);
    expect(result.column_id).toBe(5);
  });

  it('accepts optional lane_id and position', () => {
    const result = moveCardSchema.parse({
      card_id: 1,
      column_id: 5,
      lane_id: 3,
      position: 0,
    });
    expect(result.lane_id).toBe(3);
    expect(result.position).toBe(0);
  });
});

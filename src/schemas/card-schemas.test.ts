import {
  createCardSchema,
  deleteCardSubtaskSchema,
  getCardLoggedTimeSchema,
  getCardSchema,
  listCardsSchema,
  moveCardSchema,
  searchCardsSchema,
  updateCardSubtaskSchema,
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

  it.each(['active', 'archived', 'discarded', 'all'] as const)(
    'accepts state "%s"',
    (state) => {
      const result = listCardsSchema.parse({ board_id: 1, state });
      expect(result.state).toBe(state);
    }
  );

  it('keeps state undefined when omitted (backward compatible)', () => {
    const result = listCardsSchema.parse({ board_id: 1 });
    expect(result.state).toBeUndefined();
  });

  it('rejects invalid state values', () => {
    expect(() => listCardsSchema.parse({ board_id: 1, state: 'deleted' })).toThrow();
  });

  it('accepts state combined with date filters', () => {
    const result = listCardsSchema.parse({
      board_id: 285,
      type_ids: [8],
      state: 'archived',
      created_from_date: '2026-01-01',
      archived_from_date: '2026-01-01',
    });
    expect(result.state).toBe('archived');
    expect(result.created_from_date).toBe('2026-01-01');
    expect(result.archived_from_date).toBe('2026-01-01');
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

describe('searchCardsSchema', () => {
  it('accepts empty input (searches across all boards)', () => {
    const result = searchCardsSchema.parse({});
    expect(result.board_ids).toBeUndefined();
  });

  it('accepts advanced filters', () => {
    const result = searchCardsSchema.parse({
      board_ids: [1, 2],
      owner_user_ids: [42],
      priorities: [4],
      is_blocked: 1,
      state: 'archived',
      deadline_to_date: '2026-12-31',
      expand: ['transitions', 'block_times'],
    });
    expect(result.board_ids).toEqual([1, 2]);
    expect(result.is_blocked).toBe(1);
    expect(result.expand).toEqual(['transitions', 'block_times']);
  });

  it('rejects invalid state values', () => {
    expect(() => searchCardsSchema.parse({ state: 'deleted' })).toThrow();
  });
});

describe('getCardLoggedTimeSchema', () => {
  it('requires card_id', () => {
    expect(() => getCardLoggedTimeSchema.parse({})).toThrow();
  });

  it('accepts include_subtasks flag', () => {
    const result = getCardLoggedTimeSchema.parse({ card_id: 7, include_subtasks: false });
    expect(result.include_subtasks).toBe(false);
  });
});

describe('updateCardSubtaskSchema', () => {
  it('requires card_id and subtask_id', () => {
    expect(() => updateCardSubtaskSchema.parse({})).toThrow();
    expect(() => updateCardSubtaskSchema.parse({ card_id: 1 })).toThrow();
  });

  it('accepts partial updates', () => {
    const result = updateCardSubtaskSchema.parse({
      card_id: 1,
      subtask_id: 2,
      is_finished: 1,
    });
    expect(result.is_finished).toBe(1);
    expect(result.description).toBeUndefined();
  });
});

describe('deleteCardSubtaskSchema', () => {
  it('requires card_id and subtask_id', () => {
    expect(() => deleteCardSubtaskSchema.parse({ card_id: 1 })).toThrow();
    const result = deleteCardSubtaskSchema.parse({ card_id: 1, subtask_id: 2 });
    expect(result.subtask_id).toBe(2);
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

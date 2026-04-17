import type { Card, FilterState } from "../types";

export function filterCards(cards: Card[], filter: FilterState): Card[] {
  return cards.filter((card) => {
    if (
      filter.query &&
      !card.title.toLowerCase().includes(filter.query.toLowerCase()) &&
      !card.description.toLowerCase().includes(filter.query.toLowerCase())
    ) {
      return false;
    }
    if (filter.priority && card.priority !== filter.priority) {
      return false;
    }
    if (filter.tag && !card.tags.includes(filter.tag)) {
      return false;
    }
    if (
      filter.assignee &&
      card.assignee?.toLowerCase() !== filter.assignee.toLowerCase()
    ) {
      return false;
    }
    return true;
  });
}

export function isFilterActive(filter: FilterState): boolean {
  return !!(filter.query || filter.priority || filter.tag || filter.assignee);
}

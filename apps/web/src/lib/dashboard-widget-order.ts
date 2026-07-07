import {
  DASHBOARD_WIDGET_DEFINITIONS,
  type DashboardWidgetId,
  isDashboardWidgetId,
} from '@/constants/dashboard-widget-registry';

const STORAGE_KEY = 'helpdesk_dashboard_widget_order';

export function loadDashboardWidgetOrder(): DashboardWidgetId[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is DashboardWidgetId => isDashboardWidgetId(id));
  } catch {
    return [];
  }
}

export function saveDashboardWidgetOrder(order: DashboardWidgetId[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

export function mergeDashboardWidgetOrder(
  visibleIds: DashboardWidgetId[],
  savedOrder: DashboardWidgetId[],
): DashboardWidgetId[] {
  const visibleSet = new Set(visibleIds);
  const ordered: DashboardWidgetId[] = [];

  for (const id of savedOrder) {
    if (visibleSet.has(id)) {
      ordered.push(id);
      visibleSet.delete(id);
    }
  }

  const remaining = [...visibleSet].sort(
    (a, b) =>
      DASHBOARD_WIDGET_DEFINITIONS[a].order - DASHBOARD_WIDGET_DEFINITIONS[b].order,
  );

  return [...ordered, ...remaining];
}

export function reorderDashboardWidgets(
  order: DashboardWidgetId[],
  draggedId: DashboardWidgetId,
  targetId: DashboardWidgetId,
): DashboardWidgetId[] {
  const fromIndex = order.indexOf(draggedId);
  const toIndex = order.indexOf(targetId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return order;

  const next = [...order];
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, draggedId);
  return next;
}

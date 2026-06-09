export const STAFF_ROLES = [
  'waiter',
  'cooks',
  'security',
  'delivery person',
  'supervisor',
  'manager',
  'admin',
];

export const PAYROLL_ROLES = [
  'waiter',
  'cooks',
  'security',
  'delivery person',
  'supervisor',
  'manager',
];

export function normalizeRole(role = '') {
  const value = String(role).trim().toLowerCase().replace(/\s+/g, ' ');
  const map = {
    employee: 'waiter',
    waitress: 'waiter',
    waiter: 'waiter',
    cook: 'cooks',
    cooks: 'cooks',
    chef: 'cooks',
    security: 'security',
    guard: 'security',
    delivery: 'delivery person',
    'delivery guy': 'delivery person',
    'delivery person': 'delivery person',
    rider: 'delivery person',
    supervisor: 'supervisor',
    manager: 'manager',
    admin: 'admin',
    administrator: 'admin',
    customer: 'customer',
  };
  return map[value] || value;
}

export function roleLabel(role = '') {
  const normalized = normalizeRole(role);
  if (!normalized) return 'Customer';
  if (normalized === 'admin') return 'Admin';
  return normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function isAdminRole(role = '') {
  return normalizeRole(role) === 'admin';
}

export function isStaffRole(role = '') {
  return STAFF_ROLES.includes(normalizeRole(role));
}

export function staffHomeForRole(role = '') {
  const normalized = normalizeRole(role);
  if (normalized === 'admin') return '/admin';
  if (STAFF_ROLES.includes(normalized)) return '/staff-dashboard';
  return '/categories';
}

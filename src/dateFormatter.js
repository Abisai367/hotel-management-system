
export function formatChatDate(dateString) {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  if (msgDateOnly.getTime() === todayOnly.getTime()) {
    return 'Today';
  }
  if (msgDateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday';
  }
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (msgDateOnly > sevenDaysAgo && msgDateOnly < todayOnly) {
    const dayName = messageDate.toLocaleDateString('en-US', { weekday: 'long' });
    return dayName;
  }
  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatChatTime(dateString) {
  const messageDate = new Date(dateString);
  return messageDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
export function getChatDateSeparator(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  
  const msgDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (msgDateOnly.getTime() === todayOnly.getTime()) {
    return 'Today';
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (msgDateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday';
  }

  return formatChatDate(dateString);
}

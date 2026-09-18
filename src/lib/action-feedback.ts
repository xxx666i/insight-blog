const resets = new WeakMap<HTMLButtonElement, ReturnType<typeof setTimeout>>();

export function showCopyFeedback(button: HTMLButtonElement, success: boolean, defaultLabel: string) {
  const label = button.querySelector<HTMLElement>('[data-share-label]') ?? button;
  clearTimeout(resets.get(button));
  label.textContent = success ? '已复制' : '复制失败';
  button.dataset.copyState = success ? 'success' : 'error';
  button.setAttribute('data-feedback', '');
  resets.set(button, setTimeout(() => {
    label.textContent = defaultLabel;
    delete button.dataset.copyState;
    button.removeAttribute('data-feedback');
    resets.delete(button);
  }, 1600));
}

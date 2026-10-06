import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  SecurityContext,
  inject,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Directive({
  selector: '[taonCmsEditable]',
})
export class TaonCmsEditableDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef)
    .nativeElement;
  private readonly sanitizer = inject(DomSanitizer);
  private value = '';
  private composing = false;

  @Input() taonCmsEditableFormat: 'text' | 'html' = 'text';
  @Input() taonCmsEditableSingleLine = false;
  @Output() readonly taonCmsEditableChange = new EventEmitter<string>();

  @Input()
  set taonCmsEditable(value: string) {
    if (value === this.value) {
      return;
    }
    this.value = value;
    this.render();
  }

  @HostListener('compositionstart')
  compositionStart(): void {
    this.composing = true;
  }

  @HostListener('compositionend')
  compositionEnd(): void {
    this.composing = false;
    this.onInput();
  }

  @HostListener('input')
  onInput(): void {
    if (this.composing) {
      return;
    }
    const text = this.element.innerText;
    this.value =
      this.taonCmsEditableFormat === 'html'
        ? this.sanitize(this.element.innerHTML)
        : this.taonCmsEditableSingleLine
          ? text.replace(/\s*\n\s*/g, ' ')
          : text;
    // Remember emitted values so Angular does not rewrite the DOM/caret on input.
    this.taonCmsEditableChange.emit(this.value);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onInput();
    this.render();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.taonCmsEditableSingleLine && event.key === 'Enter') {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const selection = this.element.ownerDocument.getSelection();
    if (!selection?.rangeCount || !event.clipboardData) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!this.element.contains(range.commonAncestorContainer)) {
      return;
    }
    const pasted = event.clipboardData.getData('text/plain');
    const text = this.taonCmsEditableSingleLine
      ? pasted.replace(/\s*\n\s*/g, ' ')
      : pasted;
    range.deleteContents();
    const node = this.element.ownerDocument.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    this.onInput();
  }

  private sanitize(value: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, value) ?? '';
  }

  private render(): void {
    if (this.taonCmsEditableFormat === 'html') {
      this.element.innerHTML = this.sanitize(this.value);
    } else {
      this.element.textContent = this.value;
    }
  }
}

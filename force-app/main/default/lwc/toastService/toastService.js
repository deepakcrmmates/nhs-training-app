import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export function showToast(ctx, title, message, variant = 'success') {
    ctx.dispatchEvent(
        new ShowToastEvent({ title, message, variant })
    );
}
import type { MachinatChannel } from '../types';
import { makeInterface } from '../service';

export interface TextIntentDetectResult<Payload> {
  intentType?: string;
  confidence: number;
  payload: Payload;
}

/**
 * @category Base
 */
export interface BaseIntentRecognizer<Payload> {
  detectText(
    channel: MachinatChannel,
    text: string
  ): Promise<TextIntentDetectResult<Payload>>;
}

const IntentRecognizerI = makeInterface<BaseIntentRecognizer<unknown>>({
  name: 'BaseIntentRecognizerI',
});

type IntentRecognizerI<Payload> = BaseIntentRecognizer<Payload>;

export default IntentRecognizerI;

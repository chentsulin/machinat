export const ATTACHMENT_DATA = Symbol.for('attachment_data.messenger.machinat');
export const ATTACHMENT_INFO = Symbol.for('attachment_info.messenger.machinat');

export const ATTACHMENT_ASSET_TAG = Symbol.for(
  'attatchment_asset_tag.messenger.machinat'
);
export const API_PATH = Symbol.for('api_path.messenger.machinat');

export const MESSENGER = 'messenger' as const;

export const MESSENGER_MESSAGING_TYPE_RESPONSE = 'RESPONSE';

export const PATH_MESSAGES = 'me/messages';

export const PATH_PASS_THREAD_CONTROL = 'me/pass_thread_control';

export const PATH_REQUEST_THREAD_CONTROL = 'me/request_thread_control';

export const PATH_TAKE_THREAD_CONTROL = 'me/take_thread_control';

export const PATH_MESSAGE_ATTACHMENTS = 'me/message_attachments';

export const PATH_MESSENGER_PROFILE = 'me/messenger_profile';

export const PATH_PERSONAS = 'me/personas';

export enum MessengerChatType {
  UserToPage,
  UserToUser,
  Group,
}

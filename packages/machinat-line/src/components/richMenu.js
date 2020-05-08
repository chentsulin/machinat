import { unitSegment } from '@machinat/core/renderer';
import { CHANNEL_API_CALL_GETTER, BULK_API_CALL_GETTER } from '../constant';
import { annotateLineComponent } from '../utils';

function linkRichMenuCall(channel) {
  if (channel.type !== 'utob') {
    throw new TypeError(
      '<LinkRichMenu /> can only be delivered in a utob chatting channel'
    );
  }

  return {
    method: 'POST',
    path: `v2/bot/user/${channel.id}/richmenu/${this.id}`,
    body: null,
  };
}

function bulkLinkRichMenuCall(userIds) {
  return {
    method: 'POST',
    path: 'v2/bot/richmenu/bulk/link',
    body: {
      userIds,
      richMenuId: this.id,
    },
  };
}

export const LinkRichMenu = (node, path) => [
  unitSegment(node, path, {
    id: node.props.id,
    [CHANNEL_API_CALL_GETTER]: linkRichMenuCall,
    [BULK_API_CALL_GETTER]: bulkLinkRichMenuCall,
  }),
];
annotateLineComponent(LinkRichMenu);

const UNLINK_RICHMENU_API_CALLER = {
  [CHANNEL_API_CALL_GETTER](channel) {
    if (channel.type !== 'utob') {
      throw new TypeError(
        '<UnlinkRichMenu /> can only be delivered in a utob chatting channel'
      );
    }

    return {
      method: 'DELETE',
      path: `v2/bot/user/${channel.id}/richmenu`,
      body: null,
    };
  },
  [BULK_API_CALL_GETTER](userIds) {
    return {
      method: 'POST',
      path: 'v2/bot/richmenu/bulk/unlink',
      body: { userIds },
    };
  },
};

export const UnlinkRichMenu = (node, path) => [
  unitSegment(node, path, UNLINK_RICHMENU_API_CALLER),
];
annotateLineComponent(UnlinkRichMenu);

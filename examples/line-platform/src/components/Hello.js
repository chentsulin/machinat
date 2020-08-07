import Machinat from '@machinat/core';
import {
  Expression,
  QuickReply,
  PostbackAction,
} from '@machinat/messenger/components';
import { GIMME_FOX_KEY } from '../constant';

const Hello = ({ name }) => {
  return (
    <Expression
      quickReplies={
        <QuickReply
          action={<PostbackAction title="🦊💕" payload={GIMME_FOX_KEY} />}
        />
      }
    >
      <p>
        Hello {name}!
        <br />
        Do you like fox?
      </p>
    </Expression>
  );
};

export default Hello;

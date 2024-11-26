import React, { useCallback, useEffect, useRef, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";
import { CometChatList } from "../BaseComponents/CometChatList/CometChatList";
import { CometChatListItem } from "../BaseComponents/CometChatListItem/CometChatListItem";
import { CometChatUIKit } from "../../CometChatUIKit/CometChatUIKit";
import { MessageUtils } from "../../utils/MessageUtils";
import { CometChatUIKitLoginListener } from "../../CometChatUIKit/CometChatUIKitLoginListener";
import { CometChatMessageTemplate } from "../../modals";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
import { localize } from "../../resources/CometChatLocalize/cometchat-localize";
import { DatePatterns, MessageBubbleAlignment, States } from "../../Enums/Enums";
import closeIcon from "../../assets/close.svg";
import { CometChatDate } from "../BaseComponents/CometChatDate/CometChatDate";

interface MessageInformationProps {
  message: CometChat.BaseMessage;
  onClose?: () => void;
}

const CometChatMessageInformation = (props: MessageInformationProps) => {
  const {
    onClose,
    message,
  } = props;

  const [state, setState] = useState<States>(States.loading);
  const [messageReceipts, setMessageReceipts] = useState<
    CometChat.MessageReceipt[]
  >([]);
  const loggedInUser = useRef<CometChat.User | null>(null);

  /* The purpose of this function is to fetch the message information receipts data and update the states. */
  async function getMessageReceipt(message?: CometChat.BaseMessage) {
    try {
      if (
        message?.getReceiverType() ===
        CometChatUIKitConstants.MessageReceiverType.group
      ) {
        setState(States.loading);
        let messageReceiptVal: CometChat.MessageReceipt | any =
          await CometChat.getMessageReceipts(message?.getId());
        let receiptList = messageReceiptVal.filter((receipt: CometChat.MessageReceipt) =>
          receipt.getSender().getUid() !== loggedInUser.current?.getUid()) as CometChat.MessageReceipt[]
        setMessageReceipts(receiptList);
        setState(States.loaded);
        return messageReceiptVal;
      }
    } catch (error) {
      console.log(error);
      setState(States.error);
    }
  }

  useEffect(() => {
    if (message?.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user) {
      setState(States.loaded);
    }
    if (message?.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group) {
      getMessageReceipt(message);
    }
  }, [message]);

  /* This function returns close button view. */
  function getCloseBtnView() {
    return (
      <CometChatButton
        iconURL={closeIcon}
        hoverText={localize("CLOSE")}
        onClick={onClose}
      />
    );
  }

  /* This function returns Message bubble view of which information is getting viewed. */
  const getBubbleView = useCallback(() => {
    let alignment = MessageBubbleAlignment.right;
    if (CometChatUIKitLoginListener.getLoggedInUser()) {
      loggedInUser.current = CometChatUIKitLoginListener.getLoggedInUser();
    }
    if (message) {
      const templatesArray = CometChatUIKit.getDataSource()?.getAllMessageTemplates();
      const template = templatesArray?.find((template: CometChatMessageTemplate) => template.type === message.getType() && template.category === message.getCategory());
      if (!template) {
        return <></>
      }
      if (message.getSender()?.getUid() !== loggedInUser.current?.getUid()) {
        alignment = MessageBubbleAlignment.left;
      } else {
        alignment = MessageBubbleAlignment.right;
      }
      const view = new MessageUtils().getMessageBubble(
        message,
        template,
        alignment
      );
      return view;
    }
    return null;
  }, [message]);

  /**
   * Creates subtitle receipt view for group.
   */
  function getSubtitleView(
    deliveredAt: number,
    readAt?: number
  ): JSX.Element | null {
    return (
      <div className="cometchat-message-information__receipts-subtitle">
        {readAt && <div className="cometchat-message-information__receipts-subtitle-text">
          {localize("READ")}
          <CometChatDate
            timestamp={readAt}
            pattern={DatePatterns.DateTime}
          />
        </div>}

        <div className="cometchat-message-information__receipts-subtitle-text">
          {localize("DELIVERED")}
          <CometChatDate
            timestamp={deliveredAt}
            pattern={DatePatterns.DateTime}
          />
        </div>
      </div>
    )
  }

  /**
   * Creates default list item view
   */
  function getListItem(messageReceipt: CometChat.MessageReceipt) {
    return (
      <CometChatListItem
        id={messageReceipt.getMessageId()}
        title={messageReceipt.getSender()?.getName()}
        avatarURL={messageReceipt.getSender()?.getAvatar()}
        avatarName={messageReceipt.getSender()?.getName()}
        subtitleView={getSubtitleView(
          messageReceipt.getDeliveredAt(),
          messageReceipt.getReadAt()
        )}
      />
    );
  }

  return (
    <div className="cometchat cometchat-message-information">
      <div className="cometchat-message-information__header">
        <div className="cometchat-message-information__header-title">
          {localize("MESSAGE_INFORMATION")}
        </div>
        <div className="cometchat-message-information__header-close">
          {getCloseBtnView()}
        </div>
      </div>
      <div className="cometchat-message-information__message">
        {getBubbleView()}
      </div>

      {message.getReceiverType() ===
        CometChatUIKitConstants.MessageReceiverType.user && (
          <React.Fragment>
            {state === States.loading ? (<div className="cometchat-message-information__shimmer">
              {[...Array(1)].map((_, index) => (
                <div key={index} className="cometchat-message-information__shimmer-item">
                  <div className="cometchat-message-information__shimmer-item-avatar"></div>
                  <div className="cometchat-message-information__shimmer-item-title"></div>
                </div>
              ))}
            </div>) :
              state === States.error ? (<div className="cometchat-message-information__error-state">
                <div>
                  {localize("ERROR_TEXT")}
                </div>
              </div>) :
                <div className="cometchat-message-information__receipts">
                  <CometChatListItem
                    title={localize("READ")}
                    subtitleView={(
                      <div className="cometchat-message-information__receipts-subtite-text">
                        {message.getReadAt() ?
                          <CometChatDate
                            timestamp={message.getReadAt()}
                            pattern={DatePatterns.DateTime}
                          /> :
                          "----"
                        }
                      </div>
                    )}
                    avatarURL=""
                  />
                  <CometChatListItem
                    title={localize("DELIVERED")}
                    subtitleView={(
                      <div className="cometchat-message-information__receipts-subtite-text">
                        {message.getDeliveredAt() ?
                          <CometChatDate
                            timestamp={message.getDeliveredAt()}
                            pattern={DatePatterns.DateTime}
                          /> :
                          "----"
                        }
                      </div>
                    )}
                    avatarURL=""
                  />
                </div>
            }
          </React.Fragment>)
      }

      {message.getReceiverType() ===
        CometChatUIKitConstants.MessageReceiverType.group && (
          <React.Fragment>
            {state === States.loading ? (<div className="cometchat-message-information__shimmer">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="cometchat-message-information__shimmer-item">
                  <div className="cometchat-message-information__shimmer-item-avatar"></div>
                  <div className="cometchat-message-information__shimmer-item-title"></div>
                </div>
              ))}
            </div>) :
              state === States.error ? (<div className="cometchat-message-information__error-state">
                <div>
                  {localize("ERROR_TEXT")}
                </div>
              </div>) :
                <div className="cometchat-message-information__receipts">
                  {messageReceipts.length > 0 && (
                    <CometChatList
                      list={messageReceipts}
                      listItem={getListItem}
                      state={
                        messageReceipts.length === 0
                          ? States.loading
                          : States.loaded
                      }
                      hideSearch={true}
                      showSectionHeader={false}
                    />
                  )}
                  {messageReceipts.length <= 0 && (
                    <div className="cometchat-message-information__receipts-empty">
                      <div>
                        {localize("GROUP_MSG_INFO_EMPTY_STATE_MESSAGE")}
                      </div>
                    </div>
                  )}
                </div>
            }
          </React.Fragment>
        )
      }
    </div>
  );
};

export { CometChatMessageInformation };

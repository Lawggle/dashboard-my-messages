const API_BASE_URL = "https://supabase-magiclink-api.vercel.app";

// Function to detect mobile devices
function isMobileDevice() {
  // Check screen width (mobile-first approach)
  const isMobileWidth = window.innerWidth <= 768;

  // Check user agent for mobile devices
  const isMobileUserAgent =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Return true if either condition is met
  return isMobileWidth || isMobileUserAgent;
}

// Function to detect if content looks like an encrypted attachment reference
function isEncryptedAttachmentContent(content) {
  if (!content || typeof content !== "string") return false;

  // Check if content matches the pattern of encrypted attachment references
  // Pattern: base64-like string with == followed by : and another base64-like string
  const encryptedPattern = /^[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/;

  return encryptedPattern.test(content.trim());
}

async function decryptMessage(content, code_hash_lawyer, token) {
  try {
    if (!code_hash_lawyer || !content) return content;
    const res = await fetch(`${API_BASE_URL}/api/decrypt-lawyer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, code_hash_lawyer }),
    });
    if (!res.ok) return content;
    const data = await res.json();
    return data.decrypted || content;
  } catch (e) {
    return content;
  }
}

async function loadConversation(leadEmail, leadName, codeHashLawyer) {
  try {
    // Clear input text and attachments when switching conversations
    clearInputsAndAttachments();

    const insideDiv = document.querySelector(".inside-div");
    let savedHeaderBeforeLoading = null;

    if (insideDiv) {
      const existingHeader =
        insideDiv.querySelector("#inside-user-chat") ||
        insideDiv.querySelector(".user-chat");
      if (existingHeader) {
        savedHeaderBeforeLoading = existingHeader.cloneNode(true);
      }
    }

    showLoadingInConversation();

    const token = await window.$memberstackDom.getMemberCookie();
    const res = await fetch(
      `${API_BASE_URL}/api/lawyer/conversation?lead_email=${encodeURIComponent(
        leadEmail
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load conversation");

    await populateConversationUI(
      data,
      token,
      leadEmail,
      savedHeaderBeforeLoading
    );
  } catch (err) {
    console.error("Error loading conversation:", err);
  }
}

async function populateConversationUI(
  data,
  token,
  originalLeadEmail = null,
  savedHeaderFromBeforeLoading = null
) {
  const { conversation, messages, lead_name, magic_link } = data;
  let leadEmail =
    originalLeadEmail ||
    data.lead_email ||
    conversation?.lead_email ||
    conversation?.user_email;

  window.currentConversationData = {
    ...data,
    lead_email: leadEmail,
    lead_name: lead_name,
    conversation: conversation,
  };

  const insideDiv = document.querySelector(".inside-div");
  if (!insideDiv) return;

  const userChatHeaders = document.querySelectorAll(".user-chat");
  userChatHeaders.forEach((userChatHeader) => {
    if (!insideDiv.contains(userChatHeader)) {
      const initialsEl = userChatHeader.querySelector("#inside-short-name");
      if (initialsEl) initialsEl.textContent = getInitials(lead_name);

      const nameEl = userChatHeader.querySelector("#inside-name");
      if (nameEl) nameEl.textContent = lead_name;

      // Apply new initial-based background color to the user-short-name container
      const shortNameContainer =
        userChatHeader.querySelector(".user-short-name");
      if (shortNameContainer) {
        shortNameContainer.style.backgroundColor = getInitialColor(lead_name);
      }
    }
  });

  let dateTemplate = null;
  let messageTemplate = null;

  const allDateElements = document.querySelectorAll(".chat-date");
  const allMessageElements = document.querySelectorAll(".single-message");

  for (const el of allDateElements) {
    if (!insideDiv.contains(el)) {
      dateTemplate = el;
      break;
    }
  }

  for (const el of allMessageElements) {
    if (!insideDiv.contains(el)) {
      messageTemplate = el;
      break;
    }
  }
  if (!dateTemplate) {
    dateTemplate = document.createElement("div");
    dateTemplate.className = "chat-date";
  }

  if (!messageTemplate) {
    messageTemplate = document.createElement("div");
    messageTemplate.className = "single-message";
  }

  let savedHeader = null;

  if (savedHeaderFromBeforeLoading) {
    savedHeader = savedHeaderFromBeforeLoading.cloneNode(true);
  } else {
    const chatListHeaders = document.querySelectorAll(".user-chat");
    for (const header of chatListHeaders) {
      if (!insideDiv.contains(header)) {
        savedHeader = header.cloneNode(true);
        savedHeader.id = "inside-user-chat";
        savedHeader.classList.add("border-b");
        break;
      }
    }
  }

  insideDiv.innerHTML = "";

  if (savedHeader) {
    const initialsEl = savedHeader.querySelector("#inside-short-name");
    if (initialsEl) initialsEl.textContent = getInitials(lead_name);

    const nameEl = savedHeader.querySelector("#inside-name");
    if (nameEl) nameEl.textContent = lead_name;

    // Apply new initial-based background color to the user-short-name container
    const shortNameContainer = savedHeader.querySelector(".user-short-name");
    if (shortNameContainer) {
      shortNameContainer.style.backgroundColor = getInitialColor(lead_name);
    }

    savedHeader.style.display = "flex";
    savedHeader.id = "inside-user-chat";
    insideDiv.appendChild(savedHeader);
  }

  const sortedMessages = messages.sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Check if there are no messages to display
  if (!messages || messages.length === 0) {
    // Show no-messages component
    const noMessagesEl = document.querySelector("#no-messages");
    if (noMessagesEl) {
      noMessagesEl.style.display = "flex";
    }

    setupSendMessage();
    setupBackButtonListeners();
    setupDeleteButtonListeners();
    return;
  }

  const messagesByDate = {};
  sortedMessages.forEach((message) => {
    const messageDate = new Date(message.timestamp);
    const dateStr = messageDate.toLocaleDateString("en-GB");
    if (!messagesByDate[dateStr]) messagesByDate[dateStr] = [];
    messagesByDate[dateStr].push(message);
  });

  // Remove no-messages component if it exists since we have messages to display
  const noMessagesEl = document.querySelector("#no-messages");
  if (noMessagesEl) {
    noMessagesEl.style.display = "none";
  }

  for (const [dateStr, dailyMessages] of Object.entries(messagesByDate)) {
    const dateGroupDiv = document.createElement("div");
    dateGroupDiv.className = "div-block-651";
    const dateHeaderDiv = document.createElement("div");
    dateHeaderDiv.className = "div-block-647";
    const dateEl = dateTemplate.cloneNode(true);
    dateEl.textContent = dateStr;
    dateEl.style.display = "flex";
    dateHeaderDiv.appendChild(dateEl);
    dateGroupDiv.appendChild(dateHeaderDiv);

    let messageIndex = 0;
    for (const message of dailyMessages) {
      let content = message.content;
      if (message.sender_type === "lawyer" && conversation.code_hash_lawyer) {
        content = await decryptMessage(
          message.content,
          conversation.code_hash_lawyer,
          token
        );
      }

      // Check if this is an encrypted attachment content and replace with "Attachment"
      const isAttachmentContent = isEncryptedAttachmentContent(content);
      if (isAttachmentContent) {
        content = "Attachment";
      }

      if (content && content.trim()) {
        const messageEl = messageTemplate.cloneNode(true);
        messageEl.className =
          message.sender_type === "lead"
            ? "single-message left"
            : "single-message";
        messageEl.style.display = "flex";

        // Animation delay handled by CSS nth-last-child selectors
        messageIndex++;

        if (message.sender_type === "lead") {
          const bubbleEl =
            messageEl.querySelector(".div-block-648") ||
            document.createElement("div");
          bubbleEl.className = "div-block-648 white";
          const contentEl =
            bubbleEl.querySelector(".paragraph-35") ||
            document.createElement("p");
          contentEl.className = "paragraph-35";
          contentEl.textContent = content;
          if (!bubbleEl.contains(contentEl)) bubbleEl.appendChild(contentEl);
          if (!messageEl.contains(bubbleEl)) messageEl.appendChild(bubbleEl);

          const timeEl =
            messageEl.querySelector(".text-block-88") ||
            document.createElement("div");
          timeEl.className = "text-block-88";
          const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          timeEl.textContent = time;
          if (!messageEl.contains(timeEl)) messageEl.appendChild(timeEl);
        } else {
          const timeEl =
            messageEl.querySelector(".text-block-88") ||
            document.createElement("div");
          timeEl.className = "text-block-88";
          const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          timeEl.textContent = time;
          if (!messageEl.contains(timeEl)) messageEl.appendChild(timeEl);

          const bubbleEl =
            messageEl.querySelector(".div-block-648") ||
            document.createElement("div");
          bubbleEl.className = "div-block-648";
          const contentEl =
            bubbleEl.querySelector(".paragraph-35") ||
            document.createElement("p");
          contentEl.className = "paragraph-35";
          contentEl.textContent = content;
          if (!bubbleEl.contains(contentEl)) bubbleEl.appendChild(contentEl);
          if (!messageEl.contains(bubbleEl)) messageEl.appendChild(bubbleEl);
        }
        dateGroupDiv.appendChild(messageEl);
      }

      if (message.attachment_url) {
        const attachmentMessageEl = messageTemplate.cloneNode(true);
        attachmentMessageEl.className =
          message.sender_type === "lead"
            ? "single-message left"
            : "single-message";
        attachmentMessageEl.style.display = "flex";

        // Animation delay handled by CSS nth-last-child selectors
        messageIndex++;

        const attachmentName = getAttachmentName(message.attachment_url);
        const attachmentIcon = getAttachmentIcon(message.attachment_url);

        if (message.sender_type === "lead") {
          const attachmentBubbleEl = document.createElement("div");
          attachmentBubbleEl.className = "div-block-648 white";
          const attachmentContentEl = document.createElement("div");
          attachmentContentEl.className = "paragraph-35";
          attachmentContentEl.style.display = "flex";
          attachmentContentEl.style.alignItems = "center";
          attachmentContentEl.style.gap = "8px";

          const attachmentLink = document.createElement("a");
          attachmentLink.href = message.attachment_url;
          attachmentLink.target = "_blank";
          attachmentLink.rel = "noopener noreferrer";
          attachmentLink.style.color = "#007bff";
          attachmentLink.style.textDecoration = "none";
          attachmentLink.style.display = "flex";
          attachmentLink.style.alignItems = "center";
          attachmentLink.style.gap = "6px";
          attachmentLink.innerHTML = `${attachmentIcon} ${attachmentName}`;

          attachmentContentEl.appendChild(attachmentLink);
          attachmentBubbleEl.appendChild(attachmentContentEl);
          attachmentMessageEl.appendChild(attachmentBubbleEl);

          const attachmentTimeEl = document.createElement("div");
          attachmentTimeEl.className = "text-block-88";
          const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          attachmentTimeEl.textContent = time;
          attachmentMessageEl.appendChild(attachmentTimeEl);
        } else {
          const attachmentTimeEl = document.createElement("div");
          attachmentTimeEl.className = "text-block-88";
          const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          attachmentTimeEl.textContent = time;
          attachmentMessageEl.appendChild(attachmentTimeEl);

          const attachmentBubbleEl = document.createElement("div");
          attachmentBubbleEl.className = "div-block-648";
          const attachmentContentEl = document.createElement("div");
          attachmentContentEl.className = "paragraph-35";
          attachmentContentEl.style.display = "flex";
          attachmentContentEl.style.alignItems = "center";
          attachmentContentEl.style.gap = "8px";

          const attachmentLink = document.createElement("a");
          attachmentLink.href = message.attachment_url;
          attachmentLink.target = "_blank";
          attachmentLink.rel = "noopener noreferrer";
          attachmentLink.style.color = "#007bff";
          attachmentLink.style.textDecoration = "none";
          attachmentLink.style.display = "flex";
          attachmentLink.style.alignItems = "center";
          attachmentLink.style.gap = "6px";
          attachmentLink.innerHTML = `${attachmentIcon} ${attachmentName}`;

          attachmentContentEl.appendChild(attachmentLink);
          attachmentBubbleEl.appendChild(attachmentContentEl);
          attachmentMessageEl.appendChild(attachmentBubbleEl);
        }
        dateGroupDiv.appendChild(attachmentMessageEl);
      }
    }
    insideDiv.appendChild(dateGroupDiv);
  }

  setTimeout(() => {
    const insideDiv = document.querySelector(".inside-div");
    if (insideDiv) insideDiv.scrollTop = insideDiv.scrollHeight;
  }, 100);

  setupSendMessage();
  setupBackButtonListeners();
  setupDeleteButtonListeners();
}

let currentConversationData = null;
let isSendingMessage = false;

async function setupSendMessage() {
  currentConversationData = window.currentConversationData;

  isSendingMessage = false;

  removeAllSendMessageListeners();

  const messageInput = document.getElementById("msg-input");
  const sendButton = document.getElementById("send-button");
  const attachmentInput = document.getElementById("attachment");

  if (!messageInput) return;

  if (sendButton) {
    sendButton.addEventListener("click", handleSendMessage);
  }

  if (attachmentInput) {
    attachmentInput.addEventListener("change", handleAttachmentChange);
  }

  messageInput.addEventListener("keypress", handleMessageInputKeypress);
}

function removeAllSendMessageListeners() {
  const messageInput = document.getElementById("msg-input");
  const sendButton = document.getElementById("send-button");
  const attachmentInput = document.getElementById("attachment");

  if (messageInput && messageInput.parentNode) {
    const newMessageInput = messageInput.cloneNode(true);
    newMessageInput.value = messageInput.value;
    messageInput.parentNode.replaceChild(newMessageInput, messageInput);
  }

  if (sendButton && sendButton.parentNode) {
    const newSendButton = sendButton.cloneNode(true);
    sendButton.parentNode.replaceChild(newSendButton, sendButton);
  }

  if (attachmentInput && attachmentInput.parentNode) {
    const newAttachmentInput = attachmentInput.cloneNode(true);

    if (attachmentInput.files && attachmentInput.files.length > 0) {
    }
    attachmentInput.parentNode.replaceChild(
      newAttachmentInput,
      attachmentInput
    );
  }
}

async function handleSendMessage(event) {
  event.preventDefault();
  event.stopPropagation();

  if (isSendingMessage) return;

  const messageInput = document.getElementById("msg-input");
  const attachmentInput = document.getElementById("attachment");
  const sendButton = document.getElementById("send-button");
  const sendButtonIcon = document.getElementById("send-icon");
  const sendingSpinner = document.getElementById("sending-spinner");

  if (!messageInput || !sendButton) return;

  const message = messageInput.value.trim();
  const attachment = attachmentInput ? attachmentInput.files[0] : null;

  if (!message && !attachment) return;

  isSendingMessage = true;
  clearInputsAfterSend();

  sendButton.disabled = true;
  sendButtonIcon.style.display = "none";
  sendingSpinner.style.display = "block";

  try {
    await sendMessageNew(message, attachment);
  } catch (err) {
    console.error("Failed to send message:", err);
    alert("Failed to send message. Please try again.");
  } finally {
    isSendingMessage = false;
    sendButton.disabled = false;
    sendButtonIcon.style.display = "block";
    sendingSpinner.style.display = "none";
  }
}

async function handleMessageInputKeypress(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    if (isSendingMessage) return;

    const messageInput = document.getElementById("msg-input");
    const attachmentInput = document.getElementById("attachment");
    const sendButton = document.getElementById("send-button");
    const sendButtonIcon = document.getElementById("send-icon");
    const sendingSpinner = document.getElementById("sending-spinner");

    if (!messageInput) return;

    const message = messageInput.value.trim();
    const attachment = attachmentInput ? attachmentInput.files[0] : null;

    if (message || attachment) {
      isSendingMessage = true;
      clearInputsAfterSend();

      // Show spinner animation
      if (sendButton) sendButton.disabled = true;
      if (sendButtonIcon) sendButtonIcon.style.display = "none";
      if (sendingSpinner) sendingSpinner.style.display = "block";

      try {
        await sendMessageNew(message, attachment);
      } catch (err) {
        console.error("Failed to send message:", err);
        alert("Failed to send message. Please try again.");
      } finally {
        isSendingMessage = false;
        // Hide spinner animation
        if (sendButton) sendButton.disabled = false;
        if (sendButtonIcon) sendButtonIcon.style.display = "block";
        if (sendingSpinner) sendingSpinner.style.display = "none";
      }
    }
  }
}

function handleAttachmentChange() {
  const attachmentInput = document.getElementById("attachment");
  const attachIcon = document.getElementById("attach-icon");
  const attachedIcon = document.getElementById("attached-icon");
  const attachText = document.getElementById("attach-text");

  if (!attachmentInput) return;

  if (attachmentInput.files[0]) {
    // Get the container element for the sweep animation
    const attachmentContainer =
      attachmentInput.closest(".div-block-654") ||
      attachmentInput.closest(".attachment-container") ||
      attachmentInput.parentElement;

    // Add sweep animation to container
    if (attachmentContainer) {
      attachmentContainer.classList.add("attachment-upload-animation");

      // Remove sweep animation after it completes
      setTimeout(() => {
        attachmentContainer.classList.remove("attachment-upload-animation");
      }, 1200);
    }

    // Animate the icon change with bounce effect
    if (attachIcon) {
      attachIcon.classList.add("attachment-icon-bounce");

      setTimeout(() => {
        attachIcon.style.display = "none";
        attachIcon.classList.remove("attachment-icon-bounce");

        // Show success icon with pop animation
        if (attachedIcon) {
          attachedIcon.style.display = "block";
          attachedIcon.classList.add("attachment-success-pop");

          // Remove pop animation after it completes
          setTimeout(() => {
            attachedIcon.classList.remove("attachment-success-pop");
          }, 800);
        }
      }, 450);
    }

    // Animate text change
    if (attachText) {
      attachText.classList.add("attachment-text-pulse");

      setTimeout(() => {
        attachText.textContent = "✓";
        attachText.classList.remove("attachment-text-pulse");
      }, 300);
    }
  } else {
    // Reset to normal state without animation (for when file is removed)
    if (attachIcon) attachIcon.style.display = "block";
    if (attachedIcon) attachedIcon.style.display = "none";
    if (attachText) attachText.textContent = "📎";

    // Remove any lingering animation classes
    if (attachIcon) attachIcon.classList.remove("attachment-icon-bounce");
    if (attachedIcon) attachedIcon.classList.remove("attachment-success-pop");
    if (attachText) attachText.classList.remove("attachment-text-pulse");
  }
}

function clearInputsAfterSend() {
  const messageInput =
    document.getElementById("msg-input") ||
    document.getElementById("field") ||
    document.querySelector('input[name="field"]') ||
    document.querySelector(".start-message") ||
    document.querySelector('textarea[placeholder*="message"]') ||
    document.querySelector('input[placeholder*="message"]');

  const attachmentInput = document.getElementById("attachment");
  const attachIcon = document.getElementById("attach-icon");
  const attachedIcon = document.getElementById("attached-icon");
  const attachText = document.getElementById("attach-text");

  if (messageInput) {
    messageInput.value = "";
    messageInput.dispatchEvent(new Event("input", { bubbles: true }));
    setTimeout(() => {
      if (messageInput) messageInput.focus();
    }, 100);
  }

  if (attachmentInput) {
    attachmentInput.value = "";
    attachmentInput.dispatchEvent(new Event("change", { bubbles: true }));
  }
  if (attachIcon) attachIcon.style.display = "block";
  if (attachedIcon) attachedIcon.style.display = "none";
  if (attachText) attachText.textContent = "📎";
}

function clearInputsAndAttachments() {
  const messageInput =
    document.getElementById("msg-input") ||
    document.getElementById("field") ||
    document.querySelector('input[name="field"]') ||
    document.querySelector(".start-message") ||
    document.querySelector('textarea[placeholder*="message"]') ||
    document.querySelector('input[placeholder*="message"]');

  const attachmentInput = document.getElementById("attachment");
  const attachIcon = document.getElementById("attach-icon");
  const attachedIcon = document.getElementById("attached-icon");
  const attachText = document.getElementById("attach-text");

  // Clear message input
  if (messageInput) {
    messageInput.value = "";
    messageInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // Clear attachment input and reset UI
  if (attachmentInput) {
    attachmentInput.value = "";
    attachmentInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Reset attachment icons and text
  if (attachIcon) attachIcon.style.display = "block";
  if (attachedIcon) attachedIcon.style.display = "none";
  if (attachText) attachText.textContent = "📎";

  // Remove any lingering animation classes
  if (attachIcon) attachIcon.classList.remove("attachment-icon-bounce");
  if (attachedIcon) attachedIcon.classList.remove("attachment-success-pop");
  if (attachText) attachText.classList.remove("attachment-text-pulse");
}

async function sendMessageNew(content, attachment) {
  if ((!content.trim() && !attachment) || !currentConversationData) return;

  try {
    const token = await window.$memberstackDom.getMemberCookie();
    const formData = new FormData();
    formData.append("magic_link", currentConversationData.magic_link);
    formData.append("message", content || "");

    if (attachment) {
      formData.append("attachment", attachment);
    }

    const res = await fetch(`${API_BASE_URL}/api/send-message-lawyer-magic`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to send message");

    if (result.createdMessage) {
      const messageContent = result.createdMessage.content;
      const attachmentUrl = result.createdMessage.attachment_url;

      if (messageContent && messageContent.trim()) {
        await addMessageToUI(messageContent, "lawyer", token);
      }

      if (attachmentUrl) {
        await addMessageToUI("", "lawyer", token, attachmentUrl);
      }
    } else {
      // Handle both text and attachment messages without reloading
      if (content && content.trim()) {
        await addMessageToUI(content, "lawyer", token);
      }

      if (attachment) {
        // Instead of reloading the conversation, just add the attachment message
        await addMessageToUI("", "lawyer", token, null, true, attachment); // Pass the actual attachment file
      }
    }

    await updateChatListAfterMessage(content || "Attachment");
  } catch (err) {
    console.error("Error sending message:", err);
    alert("Failed to send message. Please try again.");
  }
}

async function addMessageToUI(
  messageContent,
  senderType,
  token,
  attachmentUrl = null,
  isAttachmentPlaceholder = false,
  attachmentFile = null
) {
  const insideDiv = document.querySelector(".inside-div");
  if (!insideDiv) return;

  // Hide no-messages component if it exists when adding new messages
  const noMessagesEl = document.querySelector("#no-messages");
  if (noMessagesEl) {
    noMessagesEl.style.display = "none";
  }

  const today = new Date();
  const todayStr = today.toLocaleDateString("en-GB");
  const dateGroups = insideDiv.querySelectorAll(".div-block-651");
  let todayGroup = null;

  for (const group of dateGroups) {
    const dateHeader = group.querySelector(".chat-date");
    if (dateHeader && dateHeader.textContent === todayStr) {
      todayGroup = group;
      break;
    }
  }

  if (!todayGroup) {
    const allDateElements = document.querySelectorAll(".chat-date");
    let dateTemplate = null;
    for (const el of allDateElements) {
      if (el.style.display !== "none" && el.offsetParent !== null) {
        dateTemplate = el;
        break;
      }
    }
    if (!dateTemplate) {
      dateTemplate = document.createElement("div");
      dateTemplate.className = "chat-date";
    }

    todayGroup = document.createElement("div");
    todayGroup.className = "div-block-651";
    const dateHeaderDiv = document.createElement("div");
    dateHeaderDiv.className = "div-block-647";
    const dateEl = dateTemplate.cloneNode(true);
    dateEl.textContent = todayStr;
    dateEl.style.display = "flex";
    dateHeaderDiv.appendChild(dateEl);
    todayGroup.appendChild(dateHeaderDiv);
    insideDiv.appendChild(todayGroup);
  }

  const allMessageElements = document.querySelectorAll(".single-message");
  let messageTemplate = null;
  for (const el of allMessageElements) {
    if (el.style.display !== "none" && el.offsetParent !== null) {
      messageTemplate = el;
      break;
    }
  }
  if (!messageTemplate) return;

  // If the message content is an encrypted attachment reference, show 'Attachment' instead
  if (isEncryptedAttachmentContent(messageContent)) {
    messageContent = "Attachment";
  }
  if (messageContent && messageContent.trim()) {
    const messageEl = document.createElement("div");
    messageEl.className =
      senderType === "lead"
        ? "single-message left new-message"
        : "single-message new-message";
    messageEl.style.display = "flex";

    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (senderType === "lawyer") {
      const timeEl = document.createElement("div");
      timeEl.className = "text-block-88";
      timeEl.textContent = currentTime;
      messageEl.appendChild(timeEl);
      const bubbleEl = document.createElement("div");
      bubbleEl.className = "div-block-648";
      const contentEl = document.createElement("p");
      contentEl.className = "paragraph-35";
      contentEl.textContent = messageContent;
      contentEl.style.display = "block";
      bubbleEl.appendChild(contentEl);
      messageEl.appendChild(bubbleEl);
    } else {
      const bubbleEl = document.createElement("div");
      bubbleEl.className = "div-block-648 white";
      const contentEl = document.createElement("p");
      contentEl.className = "paragraph-35";
      contentEl.textContent = messageContent;
      contentEl.style.display = "block";
      bubbleEl.appendChild(contentEl);
      messageEl.appendChild(bubbleEl);
      const timeEl = document.createElement("div");
      timeEl.className = "text-block-88";
      timeEl.textContent = currentTime;
      messageEl.appendChild(timeEl);
    }
    todayGroup.appendChild(messageEl);
  }

  // Handle both actual attachment URLs and placeholders
  if (attachmentUrl || isAttachmentPlaceholder) {
    const attachmentMessageEl = document.createElement("div");
    attachmentMessageEl.className =
      senderType === "lead"
        ? "single-message left new-message"
        : "single-message new-message";
    attachmentMessageEl.style.display = "flex";

    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (senderType === "lawyer") {
      const attachmentTimeEl = document.createElement("div");
      attachmentTimeEl.className = "text-block-88";
      attachmentTimeEl.textContent = currentTime;
      attachmentMessageEl.appendChild(attachmentTimeEl);

      const attachmentBubbleEl = document.createElement("div");
      attachmentBubbleEl.className = "div-block-648";
      const attachmentContentEl = document.createElement("div");
      attachmentContentEl.className = "paragraph-35";
      attachmentContentEl.style.display = "flex";
      attachmentContentEl.style.alignItems = "center";
      attachmentContentEl.style.gap = "8px";

      if (isAttachmentPlaceholder) {
        // Show placeholder with actual filename and icon like loaded attachments
        const fileName = attachmentFile ? attachmentFile.name : "Attachment";
        const fileIcon = attachmentFile
          ? getAttachmentIcon(attachmentFile.name)
          : "📎";

        const placeholderSpan = document.createElement("span");
        placeholderSpan.style.color = "#007bff";
        placeholderSpan.style.display = "flex";
        placeholderSpan.style.alignItems = "center";
        placeholderSpan.style.gap = "6px";
        placeholderSpan.innerHTML = `${fileIcon} ${fileName}`;
        attachmentContentEl.appendChild(placeholderSpan);
      } else {
        // Show actual attachment link
        const attachmentName = getAttachmentName(attachmentUrl);
        const attachmentIcon = getAttachmentIcon(attachmentUrl);

        const attachmentLink = document.createElement("a");
        attachmentLink.href = attachmentUrl;
        attachmentLink.target = "_blank";
        attachmentLink.rel = "noopener noreferrer";
        attachmentLink.style.color = "#007bff";
        attachmentLink.style.textDecoration = "none";
        attachmentLink.style.display = "flex";
        attachmentLink.style.alignItems = "center";
        attachmentLink.style.gap = "6px";
        attachmentLink.innerHTML = `${attachmentIcon} ${attachmentName}`;

        attachmentContentEl.appendChild(attachmentLink);
      }

      attachmentBubbleEl.appendChild(attachmentContentEl);
      attachmentMessageEl.appendChild(attachmentBubbleEl);
    } else {
      const attachmentBubbleEl = document.createElement("div");
      attachmentBubbleEl.className = "div-block-648 white";
      const attachmentContentEl = document.createElement("div");
      attachmentContentEl.className = "paragraph-35";
      attachmentContentEl.style.display = "flex";
      attachmentContentEl.style.alignItems = "center";
      attachmentContentEl.style.gap = "8px";

      if (isAttachmentPlaceholder) {
        // Show placeholder with actual filename and icon like loaded attachments
        const fileName = attachmentFile ? attachmentFile.name : "Attachment";
        const fileIcon = attachmentFile
          ? getAttachmentIcon(attachmentFile.name)
          : "📎";

        const placeholderSpan = document.createElement("span");
        placeholderSpan.style.color = "#007bff";
        placeholderSpan.style.display = "flex";
        placeholderSpan.style.alignItems = "center";
        placeholderSpan.style.gap = "6px";
        placeholderSpan.innerHTML = `${fileIcon} ${fileName}`;
        attachmentContentEl.appendChild(placeholderSpan);
      } else {
        // Show actual attachment link
        const attachmentName = getAttachmentName(attachmentUrl);
        const attachmentIcon = getAttachmentIcon(attachmentUrl);

        const attachmentLink = document.createElement("a");
        attachmentLink.href = attachmentUrl;
        attachmentLink.target = "_blank";
        attachmentLink.rel = "noopener noreferrer";
        attachmentLink.style.color = "#007bff";
        attachmentLink.style.textDecoration = "none";
        attachmentLink.style.display = "flex";
        attachmentLink.style.alignItems = "center";
        attachmentLink.style.gap = "6px";
        attachmentLink.innerHTML = `${attachmentIcon} ${attachmentName}`;

        attachmentContentEl.appendChild(attachmentLink);
      }

      attachmentBubbleEl.appendChild(attachmentContentEl);
      attachmentMessageEl.appendChild(attachmentBubbleEl);

      const attachmentTimeEl = document.createElement("div");
      attachmentTimeEl.className = "text-block-88";
      attachmentTimeEl.textContent = currentTime;
      attachmentMessageEl.appendChild(attachmentTimeEl);
    }
    todayGroup.appendChild(attachmentMessageEl);
  }

  setTimeout(() => {
    const insideDiv = document.querySelector(".inside-div");
    if (insideDiv) insideDiv.scrollTop = insideDiv.scrollHeight;
  }, 50);
}

async function updateChatListAfterMessage(messageContent) {
  try {
    if (!currentConversationData) return;

    const leadEmail = currentConversationData.lead_email;
    const chatList = document.querySelector(".chat-div");
    if (!chatList) return;

    const chatItems = chatList.querySelectorAll(".user-chat");
    for (const chatItem of chatItems) {
      const nameEl = chatItem.querySelector(".name-div .text-block-87");
      const leadName = currentConversationData.lead_name;

      if (nameEl && nameEl.textContent === leadName) {
        // Check if this chat is already at the top (first child)
        const isAlreadyAtTop = chatItem === chatList.firstElementChild;

        const messageEl = chatItem.querySelector(".message-div .text-block-87");
        if (messageEl) {
          const maxLength = 50;
          let displayMessage = messageContent || "Attachment";

          // Check if this is an encrypted attachment content and replace with "Attachment"
          if (isEncryptedAttachmentContent(displayMessage)) {
            displayMessage = "Attachment";
          }

          if (displayMessage.length > maxLength) {
            displayMessage = displayMessage.substring(0, maxLength) + "...";
          }
          messageEl.textContent = displayMessage;
        }

        const timestampEl = chatItem.querySelector(".name-div .text-block-88");
        if (timestampEl) {
          const now = new Date();
          // Since this is a new message being sent, it's always "today"
          timestampEl.textContent = now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }

        const unreadMsgEl = chatItem.querySelector(
          ".div-block-652 .paragraph-38"
        );
        const unreadContainer = chatItem.querySelector(".div-block-652");
        if (unreadMsgEl) {
          unreadMsgEl.textContent = "0";
        }
        if (unreadContainer) {
          unreadContainer.style.display = "none";
        }

        // Only move to top and animate if it's not already at the top
        if (!isAlreadyAtTop) {
          // Add animation class for moving to top
          chatItem.classList.add("new-chat-item");
          chatList.insertBefore(chatItem, chatList.firstChild);

          // Remove animation class after animation completes
          setTimeout(() => {
            chatItem.classList.remove("new-chat-item");
          }, 800);
        }

        // Ensure initial-based background color is applied
        const shortNameContainer = chatItem.querySelector(".user-short-name");
        if (shortNameContainer) {
          shortNameContainer.style.backgroundColor = getInitialColor(leadName);
        }

        break;
      }
    }
  } catch (err) {
    console.error("Error updating chat list:", err);
  }
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts
    .map((p) => p[0].toUpperCase())
    .join("")
    .slice(0, 2);
}

// Store color mappings for consistency
// New: Color palette for first letter based coloring
const USER_INITIAL_COLORS = [
  "#A9BAD9", // A-E
  "#446DB3", // F-J
  "#8AD796", // K-O
  "#38BDF8", // P-T
  "#FFE0B6", // U-Z
  "#D9A9BA", // fallback
];

function getInitialColor(name) {
  if (!name || typeof name !== "string" || !name.trim()) {
    return USER_INITIAL_COLORS[5]; // fallback
  }
  const firstChar = name.trim()[0].toUpperCase();
  if (firstChar >= "A" && firstChar <= "E") return USER_INITIAL_COLORS[0];
  if (firstChar >= "F" && firstChar <= "J") return USER_INITIAL_COLORS[1];
  if (firstChar >= "K" && firstChar <= "O") return USER_INITIAL_COLORS[2];
  if (firstChar >= "P" && firstChar <= "T") return USER_INITIAL_COLORS[3];
  if (firstChar >= "U" && firstChar <= "Z") return USER_INITIAL_COLORS[4];
  return USER_INITIAL_COLORS[5]; // fallback
}

function showLoadingInChatDiv() {
  const chatList = document.querySelector(".chat-div");
  if (!chatList) return;

  chatList.innerHTML = `
        <div class="chat-loading-container">
            <div class="chat-loading-spinner"></div>
            <div class="chat-loading-text">Loading conversations...</div>
        </div>
    `;
}

function showLoadingInConversation() {
  const insideDiv = document.querySelector(".inside-div");
  if (!insideDiv) return;

  insideDiv.innerHTML = `
        <div class="conversation-loading-container">
            <div class="conversation-loading-spinner"></div>
            <div class="conversation-loading-text">Loading conversation...</div>
        </div>
    `;
}

async function fetchLeads() {
  try {
    const chatList = document.querySelector(".chat-div");
    const template = document.querySelector(".user-chat");

    if (!chatList || !template) return;

    showLoadingInChatDiv();

    const { data: member } = await window.$memberstackDom.getCurrentMember();
    const token = await window.$memberstackDom.getMemberCookie();
    const res = await fetch(
      `${API_BASE_URL}/api/lawyer/leads-with-last-message`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const result = await res.json();
    const leads = result.leads || [];
    console.log("Fetched leads:", leads);

    // Sort leads by last message timestamp (newest first)
    leads.sort((a, b) => {
      const timeA = a.last_message_timestamp
        ? new Date(a.last_message_timestamp).getTime()
        : 0;
      const timeB = b.last_message_timestamp
        ? new Date(b.last_message_timestamp).getTime()
        : 0;
      return timeB - timeA; // Newest first
    });

    chatList.innerHTML = "";

    // Add a brief delay to show the transition from loading to content
    setTimeout(async () => {
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        const clone = template.cloneNode(true);
        clone.style.display = "flex";

        // Reset any existing animation classes and add initial state
        clone.classList.remove("new-chat-item");
        clone.style.opacity = "0";
        clone.style.transform = "translateY(20px) scale(0.95)";

        const fullName = lead.lead_name;
        const initials = getInitials(fullName);

        const shortNameEl = clone.querySelector(".user-short-name h3");
        if (shortNameEl) shortNameEl.textContent = initials;

        // Apply new initial-based background color to the user-short-name container
        const shortNameContainer = clone.querySelector(".user-short-name");
        if (shortNameContainer) {
          shortNameContainer.style.backgroundColor = getInitialColor(
            lead.lead_name
          );
        }

        const nameEls = clone.querySelectorAll(".name-div .text-block-87");
        if (nameEls && nameEls[0]) nameEls[0].textContent = fullName;

        const timestampEl = clone.querySelector(".name-div .text-block-88");
        if (timestampEl) {
          if (lead.last_message_timestamp) {
            const messageDate = new Date(lead.last_message_timestamp);
            const today = new Date();
            const isToday = messageDate.toDateString() === today.toDateString();

            if (isToday) {
              // Show time only for today's messages
              timestampEl.textContent = messageDate.toLocaleTimeString(
                "en-US",
                {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }
              );
            } else {
              // Show date only for other days (e.g., "April 28")
              timestampEl.textContent = messageDate.toLocaleDateString(
                "en-US",
                {
                  month: "long",
                  day: "numeric",
                }
              );
            }
          } else {
            timestampEl.textContent = "No timestamp";
          }
        }

        const messageEls = clone.querySelectorAll(
          ".message-div .text-block-87"
        );
        if (messageEls && messageEls[0]) {
          let displayMessage = lead.last_message || "No message";
          if (lead.last_message && lead.code_hash_lawyer) {
            displayMessage = await decryptMessage(
              lead.last_message,
              lead.code_hash_lawyer,
              token
            );
          }

          // Check if this is an encrypted attachment content and replace with "Attachment"
          if (isEncryptedAttachmentContent(displayMessage)) {
            displayMessage = "Attachment";
          }

          const maxLength = 50;
          if (displayMessage.length > maxLength) {
            displayMessage = displayMessage.substring(0, maxLength) + "...";
          }
          messageEls[0].textContent = displayMessage;
        }

        const unreadMsgEl = clone.querySelector(".div-block-652 .paragraph-38");
        const unreadContainer = clone.querySelector(".div-block-652");
        if (unreadMsgEl && unreadContainer) {
          const count = lead.unread_messages || 0;
          unreadMsgEl.textContent = `${count}`;

          // Hide the container if count is 0
          if (count === 0) {
            unreadContainer.style.display = "none";
          } else {
            unreadContainer.style.display = "flex";
          }
        }

        clone.addEventListener("click", () => {
          setActiveChat(clone);
          showConversationView();
          loadConversation(
            lead.lead_email,
            lead.lead_name,
            lead.code_hash_lawyer
          );
        });

        // Store lead data on the element for consistent color retrieval
        clone.dataset.leadEmail = lead.lead_email || "";
        clone.dataset.leadName = lead.lead_name || "";

        chatList.appendChild(clone);

        // Trigger animation after a brief delay for each item
        setTimeout(() => {
          clone.style.opacity = "";
          clone.style.transform = "";
          clone.style.animation = `chatItemSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
          clone.style.animationDelay = `${i * 0.1}s`;
        }, 50);
      }
    }, 150);
    template.remove();
  } catch (err) {
    console.error("Error loading leads:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI state - hide messages and show chat-place only on desktop
  const conversationArea = document.getElementById("user-messages");
  const chatPlaceArea = document.getElementById("chat-place");

  // Initially hide messages
  if (conversationArea) {
    conversationArea.style.display = "none";
  }

  // Only show chat-place on desktop devices
  if (chatPlaceArea && !isMobileDevice()) {
    chatPlaceArea.style.display = "flex";
  }

  fetchLeads();
  setupBackButtonListeners();
  setupDeletePopupButtons();
  setupDeleteButtonListeners();

  checkForPendingConversationNavigation();

  // Handle window resize for mobile/desktop transitions
  window.addEventListener("resize", handleViewportChange);
});

// Handle viewport changes (mobile to desktop transitions)
function handleViewportChange() {
  const conversationArea = document.getElementById("user-messages");
  const conversationsListArea = document.getElementById("conversations");
  const chatPlaceArea = document.getElementById("chat-place");

  if (!isMobileDevice()) {
    // Desktop view
    if (conversationsListArea) {
      conversationsListArea.style.display = "block";
    }

    // If there's an active conversation, show messages and hide chat-place
    if (window.currentConversationData && conversationArea) {
      conversationArea.style.display = "flex";
      if (chatPlaceArea) {
        chatPlaceArea.style.display = "none";
      }
    } else {
      // No active conversation, show chat-place and hide messages
      if (chatPlaceArea) {
        chatPlaceArea.style.display = "flex";
      }
      if (conversationArea) {
        conversationArea.style.display = "none";
      }
    }
  } else {
    // Mobile view - hide chat-place completely
    if (chatPlaceArea) {
      chatPlaceArea.style.display = "none";
    }

    // Handle mobile conversation/list visibility
    if (window.currentConversationData && conversationArea) {
      // Show conversation, hide list
      conversationArea.style.display = "flex";
      if (conversationsListArea) {
        conversationsListArea.style.display = "none";
      }
    } else {
      // Show list, hide conversation
      if (conversationsListArea) {
        conversationsListArea.style.display = "block";
      }
      if (conversationArea) {
        conversationArea.style.display = "none";
      }
    }
  }
}

function checkForPendingConversationNavigation() {
  try {
    const pendingData = sessionStorage.getItem("pendingConversation");
    if (pendingData) {
      const conversationData = JSON.parse(pendingData);

      sessionStorage.removeItem("pendingConversation");

      console.log(
        "🎯 test.js: Found pending conversation navigation:",
        conversationData
      );

      setTimeout(() => {
        console.log("🚀 test.js: Triggering conversation view...");
        showConversationView();
        loadConversation(
          conversationData.lead_email,
          conversationData.lead_name,
          conversationData.code_hash_lawyer
        );
      }, 500);
    }
  } catch (error) {
    console.error("❌ test.js: Error checking pending conversation:", error);
  }
}

window.showConversationView = showConversationView;
window.showChatListView = showChatListView;
window.loadConversation = loadConversation;

function showConversationView() {
  const conversationArea =
    document.getElementById("user-messages") ||
    document.querySelector(".inside-div");
  const conversationsListArea = document.getElementById("conversations");
  const chatPlaceArea = document.getElementById("chat-place");

  if (conversationArea) {
    conversationArea.style.display = "block";
  }

  // Hide chat-place when showing conversation (only on desktop)
  if (chatPlaceArea && !isMobileDevice()) {
    chatPlaceArea.style.display = "none";
  }

  // Only hide conversations list on mobile devices
  if (isMobileDevice() && conversationsListArea) {
    conversationsListArea.style.display = "none";
  }
}

function showChatListView() {
  const conversationArea =
    document.getElementById("user-messages") ||
    document.querySelector(".inside-div");
  const conversationsListArea = document.getElementById("conversations");
  const chatPlaceArea = document.getElementById("chat-place");

  // Hide conversation area when going back to chat list
  if (conversationArea) {
    conversationArea.style.display = "none";
  }

  // Show chat-place when going back to chat list (only on desktop)
  if (chatPlaceArea && !isMobileDevice()) {
    chatPlaceArea.style.display = "flex";
  }

  if (conversationsListArea) {
    conversationsListArea.style.display = "block";
  }

  // Clear active chat styling when going back to list
  removeActiveChat();
}

function setupBackButtonListeners() {
  const backButtonSelectors = [
    ".back-button",
    ".arrow-left",
    ".icon-arrow-left",
    '[data-action="back"]',
    ".btn-back",
    ".header-back",
  ];

  backButtonSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      element.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showChatListView();
      });
    });
  });
  const userChatHeaders = document.querySelectorAll(".user-chat");
  userChatHeaders.forEach((header) => {
    const nameArea = header.querySelector(".user-short-name");
    if (nameArea) {
      nameArea.style.cursor = "pointer";
      nameArea.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showChatListView();
      });
    }
  });
}

setupBackButtonListeners();

function setupDeleteButtonListeners() {
  const deleteButtonSelectors = [
    ".delete-button",
    ".btn-delete",
    ".delete-btn",
    "#delete-button",
    '[data-action="delete"]',
    '[data-delete="true"]',
    ".icon-delete",
    ".trash-button",
    ".remove-button",
  ];

  deleteButtonSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      element.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentConversationData && currentConversationData.magic_link) {
          showDeleteConfirmPopup();
        } else {
          showDeletePopup("No conversation selected to delete.");
        }
      });
    });
  });
}

function showDeletePopup(message) {
  const deletePopup = document.querySelector(".delete-popup");
  if (!deletePopup) return;

  const messageElement =
    deletePopup.querySelector(".paragraph-39") ||
    deletePopup.querySelector(".paragraph-6") ||
    deletePopup.querySelector("p");
  if (messageElement) {
    messageElement.textContent = message;
  }

  deletePopup.style.display = "flex";

  setTimeout(() => {
    deletePopup.style.display = "none";
  }, 3000);
}

function showDeleteConfirmPopup() {
  const deletePopup = document.querySelector(".delete-popup");
  if (!deletePopup) return;

  const messageElement =
    deletePopup.querySelector(".paragraph-39") ||
    deletePopup.querySelector(".paragraph-6") ||
    deletePopup.querySelector("p");

  deletePopup.style.display = "flex";

  setupDeletePopupButtons();
}

function setupDeletePopupButtons() {
  const deletePopup = document.querySelector(".delete-popup");
  if (!deletePopup) return;

  const confirmButton =
    deletePopup.querySelector(".delete-btn") ||
    deletePopup.querySelector('[data-action="delete"]') ||
    deletePopup.querySelector(".btn-danger");

  const cancelButton =
    deletePopup.querySelector(".cancel-btn") ||
    deletePopup.querySelector('[data-action="cancel"]') ||
    deletePopup.querySelector(".btn-cancel");

  if (confirmButton) {
    confirmButton.onclick = async function () {
      deletePopup.style.display = "none";
      await performDelete();
    };
  }

  if (cancelButton) {
    cancelButton.onclick = function () {
      deletePopup.style.display = "none";
    };
  }
}

async function performDelete() {
  try {
    const token = await window.$memberstackDom.getMemberCookie();
    const res = await fetch(`${API_BASE_URL}/api/soft-delete-conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        magic_link: currentConversationData.magic_link,
      }),
    });

    const result = await res.json();
    if (!res.ok)
      throw new Error(result.error || "Failed to delete conversation");

    window.location.reload();
  } catch (err) {
    console.error("Error deleting conversation:", err);
    showDeletePopup("Failed to delete conversation. Please try again.");
  }
}

function getAttachmentName(url) {
  if (!url) return "Attachment";

  const urlParts = url.split("/");
  const filename = urlParts[urlParts.length - 1];

  const cleanFilename = filename.split("?")[0];

  // Check if the filename looks like an encrypted/encoded string
  // (contains base64-like characters, colons, or equals signs without proper extension)
  const isEncrypted =
    (/^[A-Za-z0-9+/=:]+$/.test(cleanFilename) &&
      !cleanFilename.includes(".")) ||
    cleanFilename.includes("==:") ||
    (cleanFilename.includes("==") && cleanFilename.length > 20);

  if (isEncrypted) {
    return "Attachment";
  }

  if (cleanFilename.length > 30) {
    const extension = cleanFilename.split(".").pop();
    const nameWithoutExt = cleanFilename.substring(
      0,
      cleanFilename.lastIndexOf(".")
    );
    return `${nameWithoutExt.substring(0, 20)}...${extension}`;
  }

  return cleanFilename || "Attachment";
}

function getAttachmentIcon(url) {
  if (!url) return "📎";

  const filename = url.toLowerCase();

  if (
    filename.includes(".jpg") ||
    filename.includes(".jpeg") ||
    filename.includes(".png") ||
    filename.includes(".gif") ||
    filename.includes(".bmp") ||
    filename.includes(".webp")
  ) {
    return "🖼️";
  }

  if (
    filename.includes(".mp4") ||
    filename.includes(".avi") ||
    filename.includes(".mov") ||
    filename.includes(".wmv") ||
    filename.includes(".flv") ||
    filename.includes(".webm")
  ) {
    return "🎥";
  }

  if (
    filename.includes(".mp3") ||
    filename.includes(".wav") ||
    filename.includes(".flac") ||
    filename.includes(".aac") ||
    filename.includes(".ogg") ||
    filename.includes(".wma")
  ) {
    return "🎵";
  }

  if (filename.includes(".pdf")) {
    return "📄";
  }

  if (filename.includes(".doc") || filename.includes(".docx")) {
    return "📝";
  }

  if (filename.includes(".txt") || filename.includes(".md")) {
    return "📋";
  }

  if (filename.includes(".xls") || filename.includes(".xlsx")) {
    return "📊";
  }

  if (filename.includes(".ppt") || filename.includes(".pptx")) {
    return "📈";
  }

  if (
    filename.includes(".zip") ||
    filename.includes(".rar") ||
    filename.includes(".7z") ||
    filename.includes(".tar") ||
    filename.includes(".gz")
  ) {
    return "📦";
  }

  return "📎";
}

function setActiveChat(activeChatElement) {
  // Remove active class from all chat items
  const allChats = document.querySelectorAll(".user-chat");
  allChats.forEach((chat) => chat.classList.remove("active-chat"));

  // Add active class to the clicked chat
  if (activeChatElement) {
    activeChatElement.classList.add("active-chat");

    // Apply the same color to the active chat's border or background
    const shortNameContainer =
      activeChatElement.querySelector(".user-short-name");
    if (shortNameContainer) {
      let currentColor = shortNameContainer.style.backgroundColor;

      // If no color is set, generate and apply the initial-based color
      if (!currentColor) {
        // Get lead data from the element's dataset (stored during creation)
        const leadName = activeChatElement.dataset.leadName || "";

        // If dataset is not available, fallback to reading from DOM
        if (!leadName) {
          const nameEl = activeChatElement.querySelector(
            ".name-div .text-block-87"
          );
          const fallbackLeadName = nameEl ? nameEl.textContent : "";
          currentColor = getInitialColor(fallbackLeadName);
        } else {
          currentColor = getInitialColor(leadName);
        }

        shortNameContainer.style.backgroundColor = currentColor;
      }

      // Add a subtle border or highlight using the same color
      activeChatElement.style.borderLeft = `3px solid ${currentColor}`;
    }
  }
}

// Remove active styling when deselecting
function removeActiveChat() {
  const allChats = document.querySelectorAll(".user-chat");
  allChats.forEach((chat) => {
    chat.classList.remove("active-chat");
    chat.style.borderLeft = "";
  });
}

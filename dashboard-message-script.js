const API_BASE_URL = "https://supabase-magiclink-api.vercel.app";

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

const conversationStyles = document.createElement("style");
conversationStyles.textContent = `
    .inside-div {
        max-height: 70vh;
        overflow-y: auto;
        overflow-x: hidden;
        scroll-behavior: auto;
        padding-right: 10px;
    }
    .inside-div::-webkit-scrollbar { width: 8px; }
    .inside-div::-webkit-scrollbar-track { 
        background: #f8f9fa; 
        border-radius: 10px; 
        margin: 2px;
    }
    .inside-div::-webkit-scrollbar-thumb { 
        background: #FFA726; 
        border-radius: 10px; 
        border: 2px solid #f8f9fa;
        min-height: 30px;
    }
    .inside-div::-webkit-scrollbar-thumb:hover { 
        background: #FEE0B1; 
    }
    
    /* Ultra Fluid Loading spinner styles */
    .chat-loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40px 20px;
        flex-direction: column;
        opacity: 0;
        animation: gentleFadeInUp 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    
    .chat-loading-spinner {
        width: 40px;
        height: 40px;
        position: relative;
        animation: gentlePulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    .chat-loading-spinner::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 3px solid transparent;
        border-top: 3px solid #FFA726;
        border-right: 3px solid #FFA726;
        border-radius: 50%;
        animation: fluidSpin 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    
    .chat-loading-spinner::after {
        content: '';
        position: absolute;
        top: 6px;
        left: 6px;
        width: calc(100% - 12px);
        height: calc(100% - 12px);
        border: 2px solid transparent;
        border-bottom: 2px solid #FFB74D;
        border-left: 2px solid #FFB74D;
        border-radius: 50%;
        animation: fluidSpin 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse;
    }
    
    .chat-loading-text {
        margin-top: 20px;
        color: #666;
        font-size: 14px;
        font-weight: 500;
        animation: gentleTextBreathe 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    /* Conversation loading spinner styles */
    .conversation-loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 60px 20px;
        flex-direction: column;
        height: 100%;
        min-height: 300px;
        opacity: 0;
        animation: gentleFadeInUp 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    
    .conversation-loading-spinner {
        width: 60px;
        height: 60px;
        position: relative;
        animation: gentleFloat 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    .conversation-loading-spinner::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 4px solid transparent;
        border-top: 4px solid #FFA726;
        border-right: 4px solid #FFA726;
        border-radius: 50%;
        animation: fluidSpin 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    
    .conversation-loading-spinner::after {
        content: '';
        position: absolute;
        top: 8px;
        left: 8px;
        width: calc(100% - 16px);
        height: calc(100% - 16px);
        border: 3px solid transparent;
        border-bottom: 3px solid #FFB74D;
        border-left: 3px solid #FFB74D;
        border-radius: 50%;
        animation: fluidSpin 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse;
    }
    
    .conversation-loading-text {
        margin-top: 25px;
        color: #666;
        font-size: 16px;
        font-weight: 500;
        animation: gentleTextBreathe 5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    /* Ultra Fluid animations */
    @keyframes fluidSpin {
        0% { 
            transform: rotate(0deg) scale(1);
            opacity: 0.9;
        }
        25% { 
            transform: rotate(90deg) scale(1.02);
            opacity: 1;
        }
        50% { 
            transform: rotate(180deg) scale(1.05);
            opacity: 0.95;
        }
        75% { 
            transform: rotate(270deg) scale(1.02);
            opacity: 1;
        }
        100% { 
            transform: rotate(360deg) scale(1);
            opacity: 0.9;
        }
    }
    
    @keyframes gentlePulse {
        0%, 100% { 
            transform: scale(1);
            filter: brightness(1);
        }
        50% { 
            transform: scale(1.03);
            filter: brightness(1.05);
        }
    }
    
    @keyframes gentleFloat {
        0%, 100% { 
            transform: translateY(0) scale(1);
        }
        25% { 
            transform: translateY(-2px) scale(1.01);
        }
        50% { 
            transform: translateY(-4px) scale(1.02);
        }
        75% { 
            transform: translateY(-2px) scale(1.01);
        }
    }
    
    @keyframes gentleFadeInUp {
        0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
        }
        50% {
            opacity: 0.7;
            transform: translateY(15px) scale(0.98);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes gentleTextBreathe {
        0%, 100% { 
            opacity: 0.75;
            transform: translateY(0) scale(1);
        }
        50% { 
            opacity: 1;
            transform: translateY(-1px) scale(1.01);
        }
    }
    
    /* Smooth transitions for loading states */
    .chat-div, .inside-div {
        transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    /* Message Animation Styles */
    .single-message {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        animation: messageSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    
    .single-message.left {
        transform: translateX(-20px) translateY(10px) scale(0.95);
        animation: messageSlideInLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    
    .single-message.new-message {
        opacity: 0;
        transform: translateY(30px) scale(0.9);
        animation: newMessagePop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    
    .single-message.new-message.left {
        transform: translateX(-30px) translateY(20px) scale(0.9);
        animation: newMessagePopLeft 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    
    .div-block-648 {
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .chat-date {
        opacity: 0;
        transform: translateY(15px);
        animation: dateSlideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s forwards;
    }
    
    .div-block-651 {
        opacity: 0;
        animation: groupFadeIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    
    /* Message Animation Keyframes */
    @keyframes messageSlideIn {
        0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
        60% {
            opacity: 0.8;
            transform: translateY(-2px) scale(1.02);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes messageSlideInLeft {
        0% {
            opacity: 0;
            transform: translateX(-20px) translateY(10px) scale(0.95);
        }
        60% {
            opacity: 0.8;
            transform: translateX(2px) translateY(-2px) scale(1.02);
        }
        100% {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
        }
    }
    
    @keyframes newMessagePop {
        0% {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
        }
        50% {
            opacity: 0.9;
            transform: translateY(-5px) scale(1.05);
        }
        70% {
            opacity: 1;
            transform: translateY(2px) scale(0.98);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes newMessagePopLeft {
        0% {
            opacity: 0;
            transform: translateX(-30px) translateY(20px) scale(0.9);
        }
        50% {
            opacity: 0.9;
            transform: translateX(5px) translateY(-5px) scale(1.05);
        }
        70% {
            opacity: 1;
            transform: translateX(-2px) translateY(2px) scale(0.98);
        }
        100% {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
        }
    }
    
    @keyframes dateSlideIn {
        0% {
            opacity: 0;
            transform: translateY(15px);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes groupFadeIn {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
    
    /* Global message animation - treats ALL messages as one sequence regardless of date containers */
    /* Last 15 messages get staggered animation delays - newest first */
    .single-message:nth-last-child(1) { animation-delay: 0.1s; }  /* Last message (newest) */
    .single-message:nth-last-child(2) { animation-delay: 0.15s; }
    .single-message:nth-last-child(3) { animation-delay: 0.2s; }
    .single-message:nth-last-child(4) { animation-delay: 0.25s; }
    .single-message:nth-last-child(5) { animation-delay: 0.3s; }
    .single-message:nth-last-child(6) { animation-delay: 0.35s; }
    .single-message:nth-last-child(7) { animation-delay: 0.4s; }
    .single-message:nth-last-child(8) { animation-delay: 0.45s; }
    .single-message:nth-last-child(9) { animation-delay: 0.5s; }
    .single-message:nth-last-child(10) { animation-delay: 0.55s; }
    .single-message:nth-last-child(11) { animation-delay: 0.6s; }
    .single-message:nth-last-child(12) { animation-delay: 0.65s; }
    .single-message:nth-last-child(13) { animation-delay: 0.7s; }
    .single-message:nth-last-child(14) { animation-delay: 0.75s; }
    .single-message:nth-last-child(15) { animation-delay: 0.8s; } /* 15th-to-last message */
    
    /* No animation delay for older messages (beyond the last 15) */
    .single-message:nth-last-child(n+16) { animation-delay: 0s; }
    
    /* Chat List Initial Loading Animation */
    .user-chat {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        animation: chatItemSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    
    /* Staggered animation delays for chat items */
    .user-chat:nth-child(1) { animation-delay: 0.1s; }
    .user-chat:nth-child(2) { animation-delay: 0.2s; }
    .user-chat:nth-child(3) { animation-delay: 0.3s; }
    .user-chat:nth-child(4) { animation-delay: 0.4s; }
    .user-chat:nth-child(5) { animation-delay: 0.5s; }
    .user-chat:nth-child(6) { animation-delay: 0.6s; }
    .user-chat:nth-child(7) { animation-delay: 0.7s; }
    .user-chat:nth-child(8) { animation-delay: 0.8s; }
    .user-chat:nth-child(9) { animation-delay: 0.9s; }
    .user-chat:nth-child(10) { animation-delay: 1.0s; }
    .user-chat:nth-child(n+11) { animation-delay: 1.1s; } /* All items beyond 10th get same delay */
    
    /* Chat item enhancement */
    .user-chat {
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        cursor: pointer;
    }
    
    /* Active chat highlight */
    .user-chat.active-chat {
        background-color: #ffe0b6 !important;
        border-left: 4px solid #ffab30 !important;
        box-shadow: 0 2px 8px rgba(255, 167, 38, 0.15) !important;
        border-radius: 10px;
    }
    
    /* New chat item animation for when items are added dynamically */
    .user-chat.new-chat-item {
        opacity: 0;
        transform: translateY(30px) scale(0.9);
        animation: newChatItemPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    
    /* Animation keyframes for chat items */
    @keyframes chatItemSlideIn {
        0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
        60% {
            opacity: 0.8;
            transform: translateY(-3px) scale(1.02);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes newChatItemPop {
        0% {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
        }
        50% {
            opacity: 0.9;
            transform: translateY(-5px) scale(1.05);
        }
        70% {
            opacity: 1;
            transform: translateY(2px) scale(0.98);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    /* Loading state transition */
    .chat-div {
        transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
`;
document.head.appendChild(conversationStyles);

async function loadConversation(leadEmail, leadName, codeHashLawyer) {
  try {
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

    savedHeader.style.display = "flex";
    savedHeader.id = "inside-user-chat";
    insideDiv.appendChild(savedHeader);
  }

  const sortedMessages = messages.sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
  const messagesByDate = {};
  sortedMessages.forEach((message) => {
    const messageDate = new Date(message.timestamp);
    const dateStr = messageDate.toLocaleDateString("en-GB");
    if (!messagesByDate[dateStr]) messagesByDate[dateStr] = [];
    messagesByDate[dateStr].push(message);
  });

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
    if (attachIcon) attachIcon.style.display = "none";
    if (attachedIcon) attachedIcon.style.display = "block";
    if (attachText) attachText.textContent = "✓";
  } else {
    if (attachIcon) attachIcon.style.display = "block";
    if (attachedIcon) attachedIcon.style.display = "none";
    if (attachText) attachText.textContent = "📎";
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
      if (content.trim()) {
        await addMessageToUI(content, "lawyer", token);
      }

      if (attachment) {
        const leadEmail = currentConversationData?.lead_email;
        const leadName = currentConversationData?.lead_name;
        const codeHashLawyer =
          currentConversationData?.conversation?.code_hash_lawyer;

        setTimeout(() => {
          loadConversation(leadEmail, leadName, codeHashLawyer);
        }, 500);
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
  attachmentUrl = null
) {
  const insideDiv = document.querySelector(".inside-div");
  if (!insideDiv) return;

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

  if (attachmentUrl) {
    const attachmentMessageEl = document.createElement("div");
    attachmentMessageEl.className =
      senderType === "lead"
        ? "single-message left new-message"
        : "single-message new-message";
    attachmentMessageEl.style.display = "flex";

    const attachmentName = getAttachmentName(attachmentUrl);
    const attachmentIcon = getAttachmentIcon(attachmentUrl);

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
      attachmentBubbleEl.appendChild(attachmentContentEl);
      attachmentMessageEl.appendChild(attachmentBubbleEl);
    } else {
      const attachmentTimeEl = document.createElement("div");

      const attachmentBubbleEl = document.createElement("div");
      attachmentBubbleEl.className = "div-block-648 white";
      const attachmentContentEl = document.createElement("div");
      attachmentContentEl.className = "paragraph-35";
      attachmentContentEl.style.display = "flex";
      attachmentContentEl.style.alignItems = "center";
      attachmentContentEl.style.gap = "8px";

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
      attachmentBubbleEl.appendChild(attachmentContentEl);
      attachmentMessageEl.appendChild(attachmentBubbleEl);
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
        const messageEl = chatItem.querySelector(".message-div .text-block-87");
        if (messageEl) {
          const maxLength = 50;
          let displayMessage = messageContent || "Attachment";
          if (displayMessage.length > maxLength) {
            displayMessage = displayMessage.substring(0, maxLength) + "...";
          }
          messageEl.textContent = displayMessage;
        }

        const timestampEl = chatItem.querySelector(".name-div .text-block-88");
        if (timestampEl) {
          timestampEl.textContent = new Date().toLocaleString();
        }

        const unreadMsgEl = chatItem.querySelector(
          ".div-block-652 .paragraph-38"
        );
        if (unreadMsgEl) {
          unreadMsgEl.textContent = "0";
        }

        chatList.insertBefore(chatItem, chatList.firstChild);
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

        const nameEls = clone.querySelectorAll(".name-div .text-block-87");
        if (nameEls && nameEls[0]) nameEls[0].textContent = fullName;

        const timestampEl = clone.querySelector(".name-div .text-block-88");
        if (timestampEl) {
          timestampEl.textContent = lead.last_message_timestamp
            ? new Date(lead.last_message_timestamp).toLocaleString()
            : "No timestamp";
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
          const maxLength = 50;
          if (displayMessage.length > maxLength) {
            displayMessage = displayMessage.substring(0, maxLength) + "...";
          }
          messageEls[0].textContent = displayMessage;
        }

        const unreadMsgEl = clone.querySelector(".div-block-652 .paragraph-38");
        if (unreadMsgEl) {
          const count = lead.unread_messages || 0;
          unreadMsgEl.textContent = `${count}`;
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
  fetchLeads();
  setupBackButtonListeners();
  setupDeletePopupButtons();
  setupDeleteButtonListeners();

  checkForPendingConversationNavigation();
});

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
  const chatListArea =
    document.getElementById("chat-place") ||
    document.querySelector(".chat-div");

  if (conversationArea) {
    conversationArea.style.display = "block";
  }
  if (chatListArea) {
    chatListArea.style.display = "none";
  }
}

function showChatListView() {
  const conversationArea =
    document.getElementById("user-messages") ||
    document.querySelector(".inside-div");
  const chatListArea =
    document.getElementById("chat-place") ||
    document.querySelector(".chat-div");

  if (conversationArea) {
    conversationArea.style.display = "none";
  }
  if (chatListArea) {
    chatListArea.style.display = "block";
  }
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
  }
}

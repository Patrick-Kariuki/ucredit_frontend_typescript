import React from 'react';

interface Props {
  openEditor: () => void;
}

const CommentIcon: React.FC<Props> = ({ openEditor }) => {
  return (
    <button onClick={() => openEditor()}>
      <svg
        width="63"
        height="63"
        viewBox="0 0 63 63"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M31.5 63C48.897 63 63 48.897 63 31.5C63 14.103 48.897 0 31.5 0C14.103 0 0 14.103 0 31.5C0 48.897 14.103 63 31.5 63ZM25.6217 16.6019C27.6438 15.7643 29.8111 15.3333 31.9998 15.3333C36.4201 15.3333 40.6593 17.0892 43.7849 20.2148C46.9105 23.3404 48.6664 27.5796 48.6664 31.9999C48.6664 36.4202 46.9105 40.6594 43.7849 43.785C40.6593 46.9106 36.4201 48.6666 31.9998 48.6666H16.9998C16.6698 48.6805 16.3431 48.596 16.0612 48.4239C15.7793 48.2518 15.5549 47.9998 15.4164 47.6999C15.2888 47.3964 15.2539 47.0619 15.3162 46.7386C15.3785 46.4152 15.5352 46.1176 15.7664 45.8833L19.0998 42.5499C16.6511 39.5808 15.3185 35.8485 15.3331 31.9999C15.3331 27.5796 17.0891 23.3404 20.2147 20.2148C21.7623 18.6672 23.5996 17.4395 25.6217 16.6019ZM21.0164 45.3333H31.9998C35.0844 45.3308 38.0727 44.259 40.4557 42.3003C42.8386 40.3417 44.4688 37.6174 45.0683 34.5916C45.6679 31.5658 45.1998 28.4258 43.7438 25.7064C42.2879 22.987 39.9341 20.8566 37.0835 19.6781C34.2329 18.4996 31.0618 18.3459 28.1106 19.2432C25.1594 20.1405 22.6106 22.0333 20.8985 24.5991C19.1863 27.1649 18.4168 30.245 18.7209 33.3146C19.0251 36.3841 20.3841 39.2533 22.5664 41.4333C22.8769 41.7455 23.0511 42.1679 23.0511 42.6083C23.0511 43.0486 22.8769 43.471 22.5664 43.7832L21.0164 45.3333ZM23.6664 30.3333H40.3331C40.7751 30.3333 41.1991 30.5088 41.5116 30.8214C41.8242 31.134 41.9998 31.5579 41.9998 31.9999C41.9998 32.4419 41.8242 32.8659 41.5116 33.1784C41.1991 33.491 40.7751 33.6666 40.3331 33.6666H23.6664C23.2244 33.6666 22.8005 33.491 22.4879 33.1784C22.1754 32.8659 21.9998 32.4419 21.9998 31.9999C21.9998 31.5579 22.1754 31.134 22.4879 30.8214C22.8005 30.5088 23.2244 30.3333 23.6664 30.3333ZM26.9998 36.9999H36.9998C37.4418 36.9999 37.8657 37.1755 38.1783 37.4881C38.4908 37.8006 38.6664 38.2246 38.6664 38.6666C38.6664 39.1086 38.4908 39.5325 38.1783 39.8451C37.8657 40.1577 37.4418 40.3333 36.9998 40.3333H26.9998C26.5577 40.3333 26.1338 40.1577 25.8213 39.8451C25.5087 39.5325 25.3331 39.1086 25.3331 38.6666C25.3331 38.2246 25.5087 37.8006 25.8213 37.4881C26.1338 37.1755 26.5577 36.9999 26.9998 36.9999ZM36.9998 26.9999H26.9998C26.5577 26.9999 26.1338 26.8243 25.8213 26.5118C25.5087 26.1992 25.3331 25.7753 25.3331 25.3333C25.3331 24.8912 25.5087 24.4673 25.8213 24.1547C26.1338 23.8422 26.5577 23.6666 26.9998 23.6666H36.9998C37.4418 23.6666 37.8657 23.8422 38.1783 24.1547C38.4908 24.4673 38.6664 24.8912 38.6664 25.3333C38.6664 25.7753 38.4908 26.1992 38.1783 26.5118C37.8657 26.8243 37.4418 26.9999 36.9998 26.9999Z"
          fill="#65869B"
        />
      </svg>
    </button>
  );
};

export default CommentIcon;

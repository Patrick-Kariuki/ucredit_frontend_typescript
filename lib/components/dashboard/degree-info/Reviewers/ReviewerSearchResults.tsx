
import { useDispatch, useSelector } from 'react-redux';
import { getAPI } from '../../../../resources/assets';
import { FC, useEffect, useState } from 'react';
import emailjs from 'emailjs-com';
import clsx from 'clsx';
import { CheckIcon } from '@heroicons/react/outline';
import { toast } from 'react-toastify';
import { ReviewRequestStatus, User } from '../../../../resources/commonTypes';
import { selectPlan,
  updateSelectedPlan, } from '../../../../slices/currentPlanSlice';
import { userService } from '../../../../services';
import { selectUser } from '../../../../slices/userSlice';

emailjs.init('user_7Cn3A3FQW9PTxExf6Npel');

const ReviewersSearchResults: FC<{
  users: User[];
}> = ({ users }) => {
  const currentPlan = useSelector(selectPlan);
  const currentUser = useSelector(selectUser);
  const [planReviewers, setPlanReviewers] = useState([]);

  useEffect(() => {
    (async () => {
      const reviewers = (await userService.getPlanReviewers(currentPlan._id))
        .data;
      setPlanReviewers(reviewers);
    })();
  }, [currentPlan._id]);

  const isReviewer = (id: string) => {
    for (const { reviewer_id, status, _id } of planReviewers) {
      if (reviewer_id._id === id && status === ReviewRequestStatus.Accepted)
        return _id;
    }
    return '';
  };

  const isPending = (id: string) => {
    for (const { reviewer_id, status } of planReviewers) {
      if (reviewer_id._id === id) return status === ReviewRequestStatus.Pending;
    }
    return false;
  };

  const changeReviewer = async (user: User) => {
    console.log(currentUser.name);
    const reviewId = isReviewer(user._id);
    if (reviewId) {
      await userService.removeReview(reviewId);
      toast.success('Reviewer removed');
    } else {
      if (!isPending(user._id)) {
        const review = (
          await userService.requestReviewerPlan(
            currentPlan._id,
            user._id,
            currentUser._id,
          )
        ).data;
        emailjs.send('service_czbc7ct', 'template_9g4knbk', {
          from_name: currentUser.name,
          to_jhed: user._id,
          to_name: user.name,
          to_email: user.email,
          url: `http://localhost:3000/reviewer/${review._id}`, // TODO
        });

      } else
        toast.error('You have already requested a review from this reviewer');
    }
  };

  const getElements = (users: User[]) => {
    return users.map((user) => {
      return (
        <div
          className="flex items-center px-2 hover:bg-sky-300 hover:cursor-pointer"
          onClick={() => changeReviewer(user)}
          key={user._id}
        >
          <CheckIcon
            className={clsx('w-5 h-5', { 'opacity-0': !isReviewer(user._id) })}
          />
          <p>
            {user.name} - {user._id}
          </p>
        </div>
      );
    });
  };

  return <div className="pb-2 border-t">{getElements(users)}</div>;
};

export default ReviewersSearchResults;

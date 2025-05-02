import React from "react";
import { Clock } from "lucide-react";
import Link from "next/link";

interface Activity {
  id: string;
  type: "post" | "review" | "reply" | "alert";
  action: string;
  title?: string;
  rating?: number;
  reviewer?: string;
  content?: string;
  time: string;
  icon: React.ElementType;
  iconColor: string;
}

interface ActivityTimelineProps {
  className?: string;
  activities?: Activity[];
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  className = "",
  activities = [],
}) => {
  const hasActivities = activities.length > 0;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-100 ${className}`}
    >
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-lg text-locaposty-text-dark">
          Recent Activity
        </h2>
      </div>
      <div className="p-0">
        {!hasActivities ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-locaposty-primary" />
            </div>
            <h3 className="text-locaposty-text-dark font-medium mb-2">
              No activity yet
            </h3>
            <p className="text-locaposty-text-medium text-sm mb-4 max-w-md mx-auto">
              As you use LocaPosty to manage your Google Business Profile, your
              activity will appear here.
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start">
                    <div
                      className={`p-2 rounded-full ${activity.iconColor} mr-3 mt-0.5`}
                    >
                      <activity.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {activity.type === "post" && (
                        <div>
                          <p className="text-sm text-locaposty-text-dark font-medium">
                            Post {activity.action}:{" "}
                            <span className="font-normal">
                              {activity.title}
                            </span>
                          </p>
                          <p className="text-xs text-locaposty-text-medium mt-1">
                            {activity.time}
                          </p>
                        </div>
                      )}

                      {activity.type === "review" && (
                        <div>
                          <p className="text-sm text-locaposty-text-dark font-medium">
                            New review {activity.rating}★ from{" "}
                            {activity.reviewer}
                          </p>
                          <p className="text-sm text-locaposty-text-medium mt-1 line-clamp-1">
                            &ldquo;{activity.content}&rdquo;
                          </p>
                          <p className="text-xs text-locaposty-text-medium mt-1">
                            {activity.time}
                          </p>
                        </div>
                      )}

                      {activity.type === "reply" && (
                        <div>
                          <p className="text-sm text-locaposty-text-dark">
                            Reply {activity.action} to{" "}
                            <span className="font-medium">
                              {activity.reviewer}
                            </span>
                            &apos;s review
                          </p>
                          <p className="text-xs text-locaposty-text-medium mt-1">
                            {activity.time}
                          </p>
                        </div>
                      )}

                      {activity.type === "alert" && (
                        <div>
                          <p className="text-sm text-locaposty-text-dark font-medium">
                            {activity.title}
                          </p>
                          <p className="text-xs text-locaposty-text-medium mt-1">
                            {activity.time}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
              <Link
                href="/activity"
                className="text-sm text-locaposty-primary font-medium hover:underline"
              >
                View all activity
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;

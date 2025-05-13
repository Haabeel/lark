import * as React from "react";
import { type Column } from "../tasks/columns";
import {
  Calendar,
  type DateLocalizer,
  dateFnsLocalizer,
} from "react-big-calendar";
import {
  addMonths,
  format,
  getDay,
  type Locale,
  parse,
  startOfWeek,
  subMonths,
} from "date-fns";
import { enUS } from "date-fns/locale";

import { Button } from "../ui/button";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../styles/data-calendar.css";
import EventCard from "../tasks/EventCard";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./context-menu";

import { type User } from "@/providers/DashboardProvider";

const locales: Record<string, Locale> = {
  "en-US": enUS,
};

const localizer: DateLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CustomToolbarProps {
  date: Date;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
}

const CustomToolbar = ({ date, onNavigate }: CustomToolbarProps) => {
  return (
    <div className="m-1 mb-4 flex w-full items-center justify-center gap-x-2 lg:w-auto lg:justify-start">
      <Button
        onClick={() => onNavigate("PREV")}
        variant="secondary"
        size="icon"
        className="flex items-center"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <div className="flex h-8 w-full items-center justify-center rounded-md border border-input px-3 py-2 lg:w-auto">
        <CalendarIcon className="mr-2 size-4" />
        <p className="text-sm font-medium">{format(date, "MMMM yyyy")}</p>
      </div>
      <Button
        onClick={() => onNavigate("NEXT")}
        variant="secondary"
        size="icon"
        className="flex items-center"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

interface DataCalendarProps {
  data: Column[];
  user: User;
  selectedProject: string;
}
const DataCalendar = ({ data, user, selectedProject }: DataCalendarProps) => {
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Column | null>(null);
  const [value, setValue] = React.useState<Date>(
    data.length > 0 && data[0]?.endDate ? data[0].endDate : new Date(),
  );
  const events = data.map((task) => ({
    start: task.endDate,
    end: task.endDate,
    title: task.title,
    assignee: task.assignee,
    status: task.status,
    id: task.id,
  }));

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    if (action === "PREV") {
      setValue(subMonths(value, 1));
    } else if (action === "NEXT") {
      setValue(addMonths(value, 1));
    } else if (action === "TODAY") {
      setValue(new Date());
    }
  };

  return (
    <Calendar
      localizer={localizer}
      date={value}
      events={events}
      views={["month"]}
      defaultView="month"
      toolbar
      showAllEvents
      className="h-full"
      max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
      formats={{
        weekdayFormat: (date, culture, localizer) =>
          localizer ? localizer.format(date, "EEE", culture) : "",
      }}
      components={{
        eventWrapper: ({ event }) => (
          <ContextMenu key={event.id}>
            <ContextMenuTrigger asChild>
              {/* 
            Wrap the entire event cell (children) so right-click is captured.
            We call onContextMenu to prevent the browser’s default menu.
          */}
              <div onContextMenu={(e) => e.preventDefault()}>
                <EventCard
                  title={event.title}
                  status={event.status}
                  id={event.id}
                  assignee={event.assignee}
                  task={data.find((task) => task.id === event.id)}
                  user={user}
                />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              {user.memberships.find(
                (member) => member.projectId === selectedProject,
              )?.role === "MAINTAINER" ? (
                <>
                  <ContextMenuItem
                    onClick={() =>
                      setTimeout(() => {
                        setSelectedTask(
                          data.find((task) => task.id === event.id) ?? null,
                        );
                        setEditDialogOpen(true);
                      }, 0)
                    }
                  >
                    Edit
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() =>
                      setTimeout(() => {
                        setSelectedTask(
                          data.find((task) => task.id === event.id) ?? null,
                        );
                        setDeleteDialogOpen(true);
                      }, 0)
                    }
                    className="text-red-600"
                  >
                    Delete
                  </ContextMenuItem>
                </>
              ) : (
                <>
                  <ContextMenuItem>Edit</ContextMenuItem>
                  <ContextMenuItem className="text-red-600">
                    Delete
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ),
        toolbar: () => (
          <CustomToolbar date={value} onNavigate={handleNavigate} />
        ),
      }}
    />
  );
};

export default DataCalendar;

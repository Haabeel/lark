"use client";

import React, { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";
import Image from "next/image";
import { createBackgroundHue, initials } from "@/lib/utils";

export const AnimatedTooltip = ({
  items,
}: {
  items: {
    id: number;
    name: string;
    designation: string;
    image: string | null;
  }[];
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0); // going to set this value on mouse move
  // rotate the tooltip
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig,
  );
  // translate the tooltip
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = (event: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const halfWidth = event.target.offsetWidth / 2;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    x.set(event.nativeEvent.offsetX - halfWidth); // set the x value, which is then used in transform and rotate
  };
  return (
    <>
      {items.reverse().map((item, idx) => (
        <div
          className="group relative -mr-4"
          key={item.name}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute top-full z-50 mt-2 flex flex-col items-center justify-center rounded-md bg-black p-2 text-xs shadow-xl"
              >
                <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
                <div className="relative z-30 text-[12px] font-bold text-white">
                  {item.name}
                </div>
                <div className="text-[12px] text-white">{item.designation}</div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* <Avatar className="relative !m-0 h-[30px] w-[30px] rounded-full border-2 border-white bg-foundation-purple-700 object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105">
            {item.image && hasFetchingError ? (
              <AvatarImage
                onMouseMove={handleMouseMove}
                height={100}
                width={100}
                src={item.image}
                alt={item.name}
                onError={() => setHasFetchingError(true)}
              />
            ) : (
              <AvatarFallback onMouseMove={handleMouseMove}>
                {item.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar> */}
          {item.image && item.image !== "null" ? (
            <Image
              onMouseMove={handleMouseMove}
              height={100}
              width={100}
              src={item.image}
              alt={item.name}
              className="relative !m-0 h-[30px] w-[30px] rounded-full border-2 border-white object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105"
            />
          ) : (
            <div
              onMouseMove={handleMouseMove}
              className={`relative !m-0 flex h-[30px] w-[30px] cursor-default items-center justify-center rounded-full border-2 border-white object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105`}
              style={{ backgroundColor: createBackgroundHue() }}
            >
              {initials(item.name)}
            </div>
          )}
        </div>
      ))}
    </>
  );
};

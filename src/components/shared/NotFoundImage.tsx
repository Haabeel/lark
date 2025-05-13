import Image from "next/image";

const NotFoundImage = ({ text }: { text: string }) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center pt-16">
      <Image
        src="/not-found.png"
        width={400}
        height={500}
        className="h-auto w-[400px]"
        alt="Nothing here yet"
      />
      <p className="mt-4 text-center text-lg text-gray-500 dark:text-gray-400">
        {text}
      </p>
    </div>
  );
};

export default NotFoundImage;

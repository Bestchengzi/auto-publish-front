import { PlusIcon } from "lucide-react";
import Image from "next/image";

type PublishCoverImageFieldProps = {
  slotCount: number;
  coverImages: string[];
  helperText?: string;
  onAdd: () => void;
  onReplace: (index: number) => void;
  onRemove: (index: number) => void;
};

export function PublishCoverImageField({
  slotCount,
  coverImages,
  helperText,
  onAdd,
  onReplace,
  onRemove,
}: PublishCoverImageFieldProps) {
  return (
    <div className="space-y-2">
      <div
        className={[
          "flex gap-3 overflow-x-auto pb-1",
          slotCount === 1 ? "max-w-[150px]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {Array.from({ length: slotCount }, (_, index) => {
          const imageSrc = coverImages[index];
          return imageSrc ? (
            <div
              key={`cover-${index}`}
              className="group relative h-[115px] w-[150px] shrink-0 cursor-pointer overflow-hidden rounded-md border border-border bg-muted"
            >
              <Image
                src={imageSrc}
                alt={`封面${index + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="150px"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                <div className="flex items-center rounded-md bg-black/55 px-2 py-1 text-sm text-white shadow-sm">
                  <button
                    type="button"
                    className="cursor-pointer px-0.5 font-medium text-white/85 transition-colors hover:text-white"
                    onClick={() => onReplace(index)}
                  >
                    替换
                  </button>
                  <span className="mx-1.5 text-white/80" aria-hidden>
                    |
                  </span>
                  <button
                    type="button"
                    className="cursor-pointer px-0.5 font-medium text-white/85 transition-colors hover:text-white"
                    onClick={() => onRemove(index)}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              key={`cover-${index}`}
              type="button"
              className="flex h-[115px] w-[150px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/40"
              onClick={onAdd}
            >
              <PlusIcon className="size-7" />
            </button>
          );
        })}
      </div>
      {helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}

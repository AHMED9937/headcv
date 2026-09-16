import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ChatCircleDotsIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@headcv/ui/components/button";
import { cn } from "@headcv/utils/style";
import { useAiAssistant } from "./ai-assistant";

const POSITION_KEY = "ai-assistant-fab-position";
const DRAG_THRESHOLD = 8;

type Point = { x: number; y: number };

function loadSavedPosition(): Point {
	if (typeof window === "undefined") return { x: 0, y: 0 };
	try {
		const raw = localStorage.getItem(POSITION_KEY);
		if (raw) return JSON.parse(raw) as Point;
	} catch {
		// Storage may be disabled or contain invalid data.
	}
	return { x: 0, y: 0 };
}

export function AiAssistantFab() {
	const { hasReviewableChanges, open, openThreads } = useAiAssistant();
	const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
	const [isLoaded, setIsLoaded] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const isDraggingRef = useRef(false);
	const didDrag = useRef(false);
	const start = useRef({ clientX: 0, clientY: 0, offsetX: 0, offsetY: 0 });

	useEffect(() => {
		setOffset(loadSavedPosition());
		setIsLoaded(true);
	}, []);

	useEffect(() => {
		if (!isLoaded) return;
		try {
			localStorage.setItem(POSITION_KEY, JSON.stringify(offset));
		} catch {
			// Storage may be disabled.
		}
	}, [offset, isLoaded]);

	const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
		event.currentTarget.setPointerCapture(event.pointerId);
		isDraggingRef.current = true;
		setIsDragging(true);
		didDrag.current = false;
		start.current = {
			clientX: event.clientX,
			clientY: event.clientY,
			offsetX: offset.x,
			offsetY: offset.y,
		};
	};

	const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (!isDraggingRef.current) return;

		const dx = event.clientX - start.current.clientX;
		const dy = event.clientY - start.current.clientY;

		if (!didDrag.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
			didDrag.current = true;
		}

		if (didDrag.current) {
			setOffset({ x: start.current.offsetX + dx, y: start.current.offsetY + dy });
		}
	};

	const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
		event.currentTarget.releasePointerCapture(event.pointerId);
		isDraggingRef.current = false;
		setIsDragging(false);
	};

	const handleClick = () => {
		if (didDrag.current) {
			didDrag.current = false;
			return;
		}
		openThreads();
	};

	if (open) return null;

	return (
		<div
			className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6"
			style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
		>
			<Button
				size="lg"
				className={cn(
					"relative h-12 touch-none select-none gap-2 rounded-full px-5 shadow-xl",
					hasReviewableChanges
						? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
						: "bg-primary text-primary-foreground hover:bg-primary/90",
					isDragging ? "cursor-grabbing" : "cursor-grab",
				)}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				onClick={handleClick}
				aria-label={t`Open AI assistant`}
			>
				<ChatCircleDotsIcon className="size-5" />
				<span className="font-semibold">
					<Trans>AI Chat</Trans>
				</span>
				{hasReviewableChanges ? (
					<span className="absolute -top-1 -right-1 size-3 rounded-full bg-red-500 shadow-sm" />
				) : null}
			</Button>
		</div>
	);
}

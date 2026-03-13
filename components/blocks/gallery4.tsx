"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export interface Gallery4Item {
    id: string;
    title: string;
    description: string;
    href: string;
    image: string;
}

export interface Gallery4Props {
    title?: string;
    description?: string;
    items: Gallery4Item[];
    /**
     * 카드의 가로세로 비율을 설정합니다.
     * 예: "aspect-[16/9]", "aspect-square", "aspect-[3/4]"
     * @default "aspect-[16/9]"
     */
    imageAspectRatio?: string;
    /** section 태그에 추가할 className (기본 py-32 재정의 가능) */
    className?: string;
}

export const Gallery4 = ({
                             title = "Case Studies",
                             description = "Discover how leading companies and developers are leveraging modern web technologies.",
                             items = [],
                             imageAspectRatio = "aspect-[16/9]",
                             className,
                         }: Gallery4Props) => {
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (!carouselApi) return;
        const updateSelection = () => {
            setCanScrollPrev(carouselApi.canScrollPrev());
            setCanScrollNext(carouselApi.canScrollNext());
            setCurrentSlide(carouselApi.selectedScrollSnap());
        };
        updateSelection();
        carouselApi.on("select", updateSelection);
        return () => {
            carouselApi.off("select", updateSelection);
        };
    }, [carouselApi]);

    return (
        <section className={cn("py-32", className)}>
            <div className="container mx-auto px-4">
                <div className="mb-8 flex items-end justify-between md:mb-14 lg:mb-16">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-3xl font-medium md:text-4xl lg:text-5xl">
                            {title}
                        </h2>
                        <p className="max-w-lg text-muted-foreground">{description}</p>
                    </div>
                    <div className="hidden shrink-0 gap-2 md:flex">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => carouselApi?.scrollPrev()}
                            disabled={!canScrollPrev}
                        >
                            <ArrowLeft className="size-5" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => carouselApi?.scrollNext()}
                            disabled={!canScrollNext}
                        >
                            <ArrowRight className="size-5" />
                        </Button>
                    </div>
                </div>
            </div>
            <div className="w-full">
                <Carousel
                    setApi={setCarouselApi}
                    opts={{
                        breakpoints: {
                            "(max-width: 768px)": {
                                dragFree: true,
                            },
                        },
                    }}
                >
                    <CarouselContent className="ml-0 2xl:ml-[max(8rem,calc(50vw-700px))]">
                        {items.map((item) => (
                            <CarouselItem
                                key={item.id}
                                className="max-w-[320px] pl-[20px] lg:max-w-[360px]"
                            >
                                <a
                                    href={item.href}
                                    className="group block overflow-hidden rounded-xl border"
                                >
                                    {/* imageAspectRatio 프롭을 적용한 부분 */}
                                    <div className={cn("relative overflow-hidden w-full", imageAspectRatio)}>
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40" />
                                        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                                            <h3 className="text-xl font-bold">{item.title}</h3>
                                            <p className="mt-2 line-clamp-2 text-sm opacity-80">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
};
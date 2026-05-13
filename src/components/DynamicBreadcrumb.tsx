"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

const DASHBOARD_ROOT = {
  href: "/dashboard",
  label: "Dashboard",
};

const formatBreadcrumbLabel = (segment: string) =>
  decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const normalizeSegments = (segments: string[]) =>
  segments
    .filter((segment) => segment && !segment.startsWith("("))
    .flatMap((segment) => segment.split("/"))
    .filter(Boolean);

const DynamicBreadcrumb = () => {
  const segments = normalizeSegments(useSelectedLayoutSegments());
  const items = [
    DASHBOARD_ROOT,
    ...segments.map((segment, index) => ({
      href: `${DASHBOARD_ROOT.href}/${segments.slice(0, index + 1).join("/")}`,
      label: formatBreadcrumbLabel(segment),
    })),
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isCurrentPage = index === items.length - 1;

          return (
            <Fragment key={item.href}>
              <BreadcrumbItem>
                {isCurrentPage ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isCurrentPage ? <BreadcrumbSeparator /> : null}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default DynamicBreadcrumb;

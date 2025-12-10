import React from 'react'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  ariaLabel?: string
}

export const Section: React.FC<SectionProps> = ({ children, ariaLabel, ...props }) => {
  return (
    <section aria-label={ariaLabel} {...props}>
      {children}
    </section>
  )
}

interface NavProps extends React.HTMLAttributes<HTMLElement> {
  ariaLabel?: string
}

export const Nav: React.FC<NavProps> = ({ children, ariaLabel, ...props }) => {
  return (
    <nav aria-label={ariaLabel} {...props}>
      {children}
    </nav>
  )
}

interface AsideProps extends React.HTMLAttributes<HTMLElement> {
  ariaLabel?: string
}

export const Aside: React.FC<AsideProps> = ({ children, ariaLabel, ...props }) => {
  return (
    <aside aria-label={ariaLabel} {...props}>
      {children}
    </aside>
  )
}

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  ariaLabel?: string
}

export const Footer: React.FC<FooterProps> = ({ children, ariaLabel, ...props }) => {
  return (
    <footer role="contentinfo" aria-label={ariaLabel} {...props}>
      {children}
    </footer>
  )
}

interface MainProps extends React.HTMLAttributes<HTMLElement> {
  ariaLabel?: string
}

export const Main: React.FC<MainProps> = ({ children, ariaLabel, ...props }) => {
  return (
    <main role="main" aria-label={ariaLabel} {...props}>
      {children}
    </main>
  )
}

interface ArticleProps extends React.HTMLAttributes<HTMLElement> {
  ariaLabel?: string
}

export const Article: React.FC<ArticleProps> = ({ children, ariaLabel, ...props }) => {
  return (
    <article aria-label={ariaLabel} {...props}>
      {children}
    </article>
  )
}

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  ariaLabel?: string
}

export const Header: React.FC<HeaderProps> = ({ children, ariaLabel, ...props }) => {
  return (
    <header role="banner" aria-label={ariaLabel} {...props}>
      {children}
    </header>
  )
}

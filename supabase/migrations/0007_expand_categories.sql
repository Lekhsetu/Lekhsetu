-- ============================================================
-- Lekhsetu – Expand story categories from 6 to 50
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

alter table public.stories drop constraint if exists stories_category_check;

alter table public.stories add constraint stories_category_check
  check (category in (
    'career','life','knowledge','tech','finance','health',
    'relationships','family','love','friendship','heartbreak','marriage',
    'parenting','education','exams','travel','immigration','culture',
    'spirituality','mentalhealth','motivation','failure','success',
    'entrepreneurship','startup','job','layoff','studentlife','firstjob',
    'army','sports','art','music','writing','books','cinema','food',
    'fashion','nature','socialissues','politics','history','science',
    'selfimprovement','confessions','nostalgia','smalltown','women','lgbtq','fiction'
  ));

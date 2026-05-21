import { useFirestoreCollection } from "./useFirestore";

let cachedHeroes = null;

export function usePageHero(pageKey) {
  const { data: pageHeroes, loading } = useFirestoreCollection("pageHeroImages", {
    fallbackData: cachedHeroes || [],
    fallbackWhenEmpty: false,
  });

  if (pageHeroes.length > 0) cachedHeroes = pageHeroes;

  const hero = pageHeroes.find(
    (item) => item.page?.toLowerCase() === pageKey.toLowerCase()
  );

  return { heroImage: hero?.imageUrl || null, loading };
}
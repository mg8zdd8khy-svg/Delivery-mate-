# DeliveryMate V2

PWA do rejestrowania pracy delivery, zarobków, kilometrów i kosztów paliwa.

## Publikacja przez GitHub Pages
1. Utwórz publiczne repozytorium na GitHubie.
2. Wgraj całą zawartość tego folderu do katalogu głównego repozytorium.
3. Wejdź w Settings → Pages.
4. Wybierz Deploy from a branch → `main` → `/ (root)` → Save.
5. Po publikacji otwórz adres HTTPS w Safari na iPhonie.
6. Udostępnij → Dodaj do ekranu głównego.

## Funkcje
- Ekran powitalny z datą i godziną.
- Własna lista pojazdów: skuter, samochód, rower.
- Konfiguracja ceny paliwa i progów opłacalności przy starcie dnia.
- Kilometry z narastającego stanu licznika.
- Ocena zamówienia na podstawie zarobku netto/km.
- Statystyki dzienne, miesięczne i platformowe.
- Zamykanie dnia i podsumowanie.
- Lokalny zapis danych i eksport kopii JSON.
- Instrukcja instalacji na ekranie głównym iPhone'a.

## Ważne ograniczenia
To wersja PWA działająca lokalnie w przeglądarce. Dane są zapisane na urządzeniu w localStorage; nie ma konta ani synchronizacji między urządzeniami. Logo jest autorskim wektorowym opracowaniem zatwierdzonego kierunku, a nie oficjalnym znakiem żadnej platformy delivery. Oceny kursów bazują na wpisanych kwotach i przebiegu; nie ma automatycznego pobierania danych z Uber Eats, Glovo ani Pyszne.pl.

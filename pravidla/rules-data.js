const rule = (name, definition, correct, wrong, notes = "Při nejasnosti před pokračováním scény kontaktujte administrátora. Výjimku lze uplatnit pouze tehdy, pokud je výslovně uvedena v pravidlech nebo schválena realizačním týmem.", why = "") => ({
  name,
  definition,
  detail: `${definition} Hráč musí situaci posuzovat z pohledu své postavy, s ohledem na dobové prostředí roku 1899, předchozí události a prostor ostatních účastníků. Neznalost pojmu ani technické omezení samo o sobě neomlouvá jednání, které poškodí rozehraný příběh.`,
  why: why || `Pravidlo chrání uvěřitelnost společného světa, rovné podmínky a možnost všech zúčastněných reagovat. Bez něj by jednostranná výhoda jednoho hráče převážila nad společným příběhem.`,
  correct,
  wrong,
  notes
});

window.RULE_CHAPTERS = [
  {
    slug: "uvod", title: "Úvod", icon: "I", summary: "Smysl Deadstone, očekávání, whitelist a způsob výkladu pravidel.",
    sections: [
      rule("Filosofie serveru", "Deadstone je příběhově orientovaný svět, v němž má spolupráce na scéně přednost před osobním vítězstvím.", "Hráč přijme i nepříznivý vývoj a využije jej jako začátek dalšího příběhu.", "Hráč přeruší scénu, protože nevyhrává, a požaduje okamžitý zásah administrátora.", "Soutěživost je přípustná uvnitř příběhu, nikdy však nesmí přerůst v OOC nepřátelství."),
      rule("Co je Deadstone", "Deadstone Roleplay je československý RedM server zasazený do alternativního amerického státu v roce 1899.", "Postava používá dobové znalosti, způsoby dopravy a společenské normy.", "Postava mluví o mobilním telefonu, internetu nebo událostech z budoucnosti.", "Historická věrnost se vyžaduje v rozumné míře; svět Deadstone má vlastní lore."),
      rule("Co očekáváme od hráčů", "Každý hráč odpovídá za připravenost, slušné jednání, funkční techniku a respekt k příběhu druhých.", "Nováček přizná OOC neznalost, po scéně si vyhledá pojem a poučí se.", "Hráč záměrně provokuje konflikt a následně se odvolává na to, že pravidla nečetl."),
      rule("Jak funguje whitelist", "Whitelist je ověření, zda zájemce rozumí základům RP, pravidlům a prostředí serveru.", "Uchazeč odpovídá vlastními slovy a na modelové situaci vysvětlí své rozhodnutí.", "Uchazeč čte připravené odpovědi jiné osoby nebo zatajuje předchozí tresty.", "Úspěšný whitelist není trvalým nárokem na přístup; pravidla platí i po jeho získání."),
      rule("Výklad pravidel", "Pravidla se vykládají podle jejich účelu, nikoli pouze podle doslovného znění vytrženého z kontextu.", "Hráč zvolí bezpečnější a férovější variantu, i když není popsána jednou konkrétní větou.", "Hráč hledá mezeru v textu, aby obešel zjevný smysl pravidla.", "Konečný výklad v konkrétním případu náleží administraci; rozhodnutí lze řešit odvoláním.")
    ]
  },
  {
    slug: "roleplay-zaklady", title: "Roleplay základy", icon: "II", summary: "Rozdíl mezi hráčem a postavou, komunikační vrstvy a kontinuita příběhu.",
    sections: [
      rule("IC — In Character", "IC označuje vše, co se děje ve fikčním světě a co může postava vnímat, říci nebo vykonat.", "Šerif reaguje na výhrůžku podle informací, které skutečně slyšel ve hře.", "Hráč použije zprávu z Discordu jako důkaz, který jeho postava nikdy nezískala."),
      rule("OOC — Out of Character", "OOC označuje komunikaci a informace mimo herní svět mezi skutečnými hráči.", "Technický problém hráč stručně oznámí povoleným OOC kanálem a po vyřešení pokračuje.", "Hráč během vyjednávání hlasitě rozebírá pravidla a tresty."),
      rule("LOOC — Local Out of Character", "LOOC je lokální OOC kanál určený pouze pro nezbytné technické sdělení účastníkům blízké scény.", "Hráč napíše, že mu na deset sekund vypadl zvuk, a ihned se vrátí do role.", "Hráč přes LOOC uráží protivníka nebo mu radí, jak má scénu odehrát."),
      rule("Příkaz /me", "Příkaz /me popisuje viditelnou fyzickou činnost postavy, kterou nelze dostatečně vyjádřit animací nebo hlasem.", "Hráč napíše „/me levou rukou přitlačil čisté plátno na krvácející ránu“ a poskytne ostatním prostor reagovat.", "Hráč napíše „/me poznal, že muž lže, a okamžitě mu vyrazil zbraň“, čímž popíše myšlenku a vnutí výsledek.", "Text se píše věcně ve třetí osobě. Nesmí obsahovat myšlenky, neviditelné informace ani výsledek akce jiné postavy."),
      rule("Příkaz /do", "Příkaz /do pravdivě doplňuje stav postavy, předmětu nebo prostředí a může položit otázku, na kterou druhý hráč odpoví podle skutečnosti.", "Lékař se zeptá „/do Byla by na kabátu viditelná krev?“ a zraněný pravdivě popíše stav.", "Hráč napíše „/do Muž by upadl do bezvědomí a nemohl se bránit“, přestože o výsledku rozhoduje druhý účastník.", "Pomocí /do je zakázáno lhát, popisovat cizí myšlenky nebo ovládat cizí postavu."),
      rule("Charakter", "Charakter je konzistentní fiktivní osoba s vlastní povahou, motivací, slabostmi a hranicemi.", "Opatrný lékař i pod tlakem odmítne bezdůvodně mučit zajatce.", "Mírumilovná postava se bez vývoje přes noc změní v masového vraha kvůli zisku."),
      rule("Lore postavy", "Lore postavy je uvěřitelný osobní příběh odpovídající světu, věku a schopnostem postavy.", "Bývalý vojenský zdravotník umí základní ošetření, ale respektuje zkušenějšího lékaře.", "Dvacetiletá postava tvrdí, že byla generálem, soudcem i nejlepším chirurgem."),
      rule("Kontinuita postavy", "Důležité události, vztahy, zranění a závazky postavy musí mít přiměřené trvání a následky.", "Postava si po únosu pamatuje strach, pachatele a změní své chování.", "Hráč druhý den ignoruje včerejší těžké zranění a jedná, jako by se nic nestalo."),
      rule("Passive Roleplay", "Passive RP znamená respektovat, že herní svět obývají lidé a fungují v něm instituce i tehdy, když jejich hráči nebo NPC nejsou právě viditelní.", "Zloděj plánuje noční vloupání mimo hlavní ulici, počítá se svědky a po činu rychle zmizí.", "Gang za bílého dne mučí člověka před bankou a tvrdí, že město je prázdné, protože není online žádný šerif.", "Passive RP nevytváří bezpečnou zónu a nelze jej použít ke zrušení již rozehrané scény.")
    ]
  },
  {
    slug: "zakazane-praktiky", title: "Zakázané herní praktiky", icon: "III", summary: "Jednání, které ničí férovost, kontinuitu nebo možnost ostatních reagovat.",
    sections: [
      rule("Metagaming", "Metagaming je použití OOC informace ve prospěch postavy, která ji nezískala řádnou IC cestou.", "Hráč ignoruje polohu viděnou na streamu a pátrá pouze podle stop nalezených ve hře.", "Hráč přijede zachránit přítele na místo, které zjistil z Discordu."),
      rule("Powergaming", "Powergaming je vnucení výsledku druhé postavě nebo provedení nereálné akce bez prostoru k reakci.", "Hráč popíše pokus o odzbrojení a nechá protivníka reagovat.", "Hráč oznámí, že druhého okamžitě omráčil a svázal bez možnosti obrany."),
      rule("FailRP", "FailRP je závažné nebo opakované jednání odporující logice postavy, situace či světa.", "Zraněný bandita ustoupí a hledá pomoc.", "Postřelený hráč sprintuje, skáče a vtipkuje bez jakékoliv reakce."),
      rule("FearRP", "FearRP vyžaduje uvěřitelný strach o život, zdraví, svobodu a významný majetek postavy.", "Obklíčená postava se pod namířenými zbraněmi vzdá nebo rozumně vyjednává.", "Neozbrojený člověk se vysmívá pěti ozbrojeným únoscům a bezdůvodně útočí."),
      rule("Random Death Match", "RDM je napadení nebo zabití postavy bez dostatečného IC důvodu, vývoje a přiměřené eskalace.", "Dlouhodobý spor vyústí po jasných výhrůžkách a možnosti ustoupit v přestřelku.", "Hráč zastřelí náhodného kolemjdoucího, protože se mu nelíbí jeho klobouk."),
      rule("Kill on Sight", "KOS je úmyslný smrtící útok bez bezprostředně předcházející srozumitelné interakce, varování nebo situace, ze které je hrozba střelby jednoznačně patrná.", "Pronásledovatelé pachatele jasně vyzvou k zastavení a vystřelí až poté, co ozbrojeně odmítne a začne mířit.", "Střelec z dálky zabije člověka pouze podle oblečení; výstražný výstřel bez vysvětlení vydává za dostatečnou interakci.", "Bezprostřední obrana života proti právě probíhajícímu útoku nevyžaduje nové varování. Starý konflikt není trvalým oprávněním ke KOS."),
      rule("Vehicle Death Match", "VDM je úmyslné použití vozu, koně či jiného dopravního prostředku jako nesmyslné zbraně.", "Kočí se snaží zabrzdit, když mu někdo vběhne před dostavník.", "Hráč opakovaně najíždí vozem do davu, aby získal výhodu."),
      rule("Combat Logging", "Combat logging je odpojení za účelem úniku z probíhající scény, zadržení, zranění nebo následků.", "Po pádu hry hráč informuje účastníky a co nejdříve se vrátí.", "Hráč se odpojí ve chvíli, kdy jej šerif spoutává."),
      rule("Revenge Kill", "Revenge Kill je okamžitá nebo nepřiměřená odveta založená na znalostech, které postava po bezvědomí či smrti nemá.", "Postava po zotavení pátrá jen podle zachovaných vzpomínek a nových stop.", "Hráč se po oživení vrátí na místo a zastřelí vítěze předchozí přestřelky."),
      rule("Spawn Kill", "Spawn Kill je číhání u místa připojení, nemocnice či návratu postavy s cílem okamžitě ji napadnout.", "Pronásledovatel poskytne navrátivší se postavě reálný čas vstoupit do světa.", "Gang čeká před nemocnicí a opakovaně napadá právě ošetřené hráče."),
      rule("Stream Sniping", "Stream sniping je sledování vysílání za účelem získání polohy, plánů nebo jiné herní výhody.", "Hráč sledující stream se nepřipojí do související scény.", "Hráč podle živého vysílání najde skrýš a přepadne streamera."),
      rule("Ghosting", "Ghosting je předávání informací o aktivní scéně osobou, která se jí nemůže řádně účastnit.", "Vyřazený hráč mlčí, dokud informace nezíská jeho postava IC.", "Mrtvý člen gangu přes hlasový kanál hlásí pohyb šerifů."),
      rule("Bug Abuse", "Bug abuse je vědomé využívání chyby hry nebo skriptu k výhodě, obohacení či úniku.", "Hráč chybu nahlásí a získaný předmět nepoužije.", "Hráč opakuje chybu, která duplikuje peníze."),
      rule("Exploit", "Exploit je záměrný postup obcházející zamýšlenou mechaniku, i když nejde o klasickou chybu.", "Hráč používá inventář a animace způsobem, pro který byly určeny.", "Hráč kombinuje animace, aby prošel zamčenými dveřmi."),
      rule("Asspulling", "Asspulling je nereálné okamžité vytažení dlouhé zbraně nebo objemného předmětu bez předchozího viditelného nošení či odpovídajícího RP úkonu.", "Jezdec před vstupem do nebezpečné oblasti sundá pušku z koně a nese ji na rameni.", "Hráč během běžného rozhovoru bez pohybu okamžitě vytáhne opakovací pušku z neexistujícího úkrytu.", "Krátkou zbraň lze tasit z přiměřeného pouzdra. Aktuální serverové mechaniky mohou rozsah pravidla dále upřesnit."),
      rule("Cheating", "Cheating je použití nepovoleného programu, úpravy, makra nebo zásahu poskytujícího výhodu.", "Hráč používá pouze schválené grafické a přístupnostní úpravy.", "Hráč používá aimbot, wallhack nebo automatizované makro.", "Podezřelý software předem konzultujte. Cheating zpravidla vede k permanentnímu banu.")
    ]
  },
  {
    slug: "komunikace", title: "Komunikace", icon: "IV", summary: "Hlas, mikrofon, hranice projevu a pravidla komunitních kanálů.",
    sections: [
      rule("Voice RP", "Hlasová komunikace je primární nástroj roleplaye a musí odpovídat stavu, vzdálenosti i emocím postavy.", "Postava šeptá při ukrývání a křičí pouze tam, kde je to přirozené.", "Hráč bezdůvodně pouští hudbu do mikrofonu a překřikuje scénu."),
      rule("Mikrofon", "Hráč musí mít srozumitelný mikrofon bez trvalého ruchu, ozvěny a rušivých zvuků.", "Před vstupem hráč otestuje citlivost a při závadě ji opraví.", "Hráč dlouhodobě vysílá hluk domácnosti a odmítá používat push-to-talk."),
      rule("Vulgarita", "Vulgarita smí být součástí charakteru, nesmí však sloužit k OOC ponižování nebo obtěžování.", "Bandita v napjaté scéně použije přiměřenou dobovou nadávku.", "Hráč systematicky uráží konkrétního člověka a skrývá to za IC."),
      rule("Rasismus", "Rasistické útoky vůči skutečným hráčům jsou zakázány; historická diskriminace vyžaduje citlivost, souhlas a příběhový smysl.", "Citlivé téma je předem domluveno a lze jej kdykoli bezpečně ukončit.", "Hráč používá rasové urážky pro vlastní zábavu nebo šokování."),
      rule("Sexismus", "Sexismus a sexuální obtěžování vůči hráčům nejsou tolerovány; dobový konflikt nesmí překročit osobní hranice.", "Postavy řeší dobové společenské překážky bez ponižování hráče.", "Hráč opakovaně pronáší sexualizované poznámky navzdory nesouhlasu."),
      rule("OOC v IC", "OOC témata, herní mechaniky a administrativní spory nepatří do IC hlasové komunikace.", "Technickou závadu hráč stručně sdělí přes LOOC.", "Postava mluví o klávesách, FPS, Discordu nebo adminovi."),
      rule("Discord pravidla", "Komunitní Discord je OOC prostor, kde platí slušnost, ochrana soukromí a zákaz vynášení IC informací.", "Hráč používá správný kanál a spor řeší věcně.", "Hráč zveřejní cizí osobní údaje nebo plánuje IC přepadení v OOC chatu."),
      rule("Nahrávání a streamování", "Záznam hry je dovolen pro vlastní tvorbu a dokazování sporů, nesmí však odhalovat chráněné administrativní nebo interní informace ani podporovat stream sniping.", "Streamer skryje interní dokumenty, nečte během hry taktické rady z chatu a spornou scénu uchová pro ticket.", "Hráč živě vysílá administrativní rozhovor, obsah ticketu nebo neveřejné státní záznamy.", "Záznamy z ticketů, administrativních místností a neveřejných systémů se nesmí bez souhlasu zveřejňovat.")
    ]
  },
  {
    slug: "realismus", title: "Realismus", icon: "V", summary: "Tělesné potřeby, zdravotní stavy a uvěřitelné následky.",
    sections: [
      rule("Bolest", "Postava musí bolest přiměřeně projevit podle závažnosti, místa a průběhu poranění.", "Po pádu z koně kulhá, ztíženě dýchá a vyhledá pomoc.", "Po zásahu kulkou ihned pokračuje v plném sprintu."),
      rule("Krvácení", "Krvácení omezuje výkon postavy a bez ošetření se může postupně zhoršovat.", "Postava stlačí ránu, šetří síly a přivolá lékaře.", "Hráč ignoruje silné krvácení během dlouhé honičky."),
      rule("Nemoci", "Nemoc se hraje konzistentně a nesmí být účelově zapínána či rušena podle výhody.", "Nemocná postava odpočívá a dodržuje léčbu.", "Postava je nemocná pouze před povinností a okamžitě zdravá při výdělku."),
      rule("Zranění", "Zranění musí odpovídat mechanismu úrazu a ovlivnit pohyb, řeč i schopnosti.", "Zlomená ruka znemožní jisté míření a těžkou práci.", "Postava s rozdrcenou nohou nasedne na koně a závodí."),
      rule("Léčení", "Léčba vyžaduje přiměřený čas, odbornou péči a následnou rekonvalescenci.", "Pacient respektuje doporučení lékaře a stav zlepšuje postupně.", "Hráč po jednom obvazu prohlásí smrtelné zranění za zcela vyléčené."),
      rule("Smrt", "Smrt postavy je závažný příběhový konec a řídí se pravidly CK, nikoli momentální frustrací.", "Hráč projedná trvalou smrt a důstojně uzavře příběh.", "Hráč prohlásí cizí postavu za definitivně mrtvou bez oprávnění."),
      rule("PK — Player Kill", "PK je mechanické vyřazení postavy, po kterém její příběh pokračuje, ale utrpěná zranění, ošetření a přiměřená doba zotavení musí být odehrány.", "Po přestřelce postava vyčká na dokončení scény, podstoupí léčbu a další konflikt sama nevyhledává, dokud se věrohodně nezotaví.", "Hráč se po respawnu okamžitě vrátí se zbraní na stejné místo a zahájí odvetu.", "PK není CK a automaticky nemaže všechny vzpomínky. Účelová amnézie nesmí sloužit k úniku před výslechem, dluhem nebo jiným následkem."),
      rule(
        "Gross Roleplay",
        "Gross RP označuje mimořádně citlivou scénu obsahující ponižování, mučení, závažnou diskriminaci, sexuálně laděné obtěžování nebo jiný obsah, který může být hráčům nepříjemný či psychicky zatěžující.",
        "Před zahájením únosci v LOOC stručně a bez explicitních detailů popíší zamýšlený rámec scény. Všichni účastníci jej výslovně přijmou, domluví si hranice a během hry respektují pokyn k okamžitému ukončení. Pokud se připojí další hráč, citlivý obsah se pozastaví, dokud i on svobodně nevyjádří souhlas.",
        "Hráč začne bez předchozí dohody podrobně popisovat mučení, pokračuje po odmítnutí nebo tvrdí, že souhlas není potřeba, protože krutost odpovídá povaze jeho postavy.",
        "Souhlas musí být konkrétní, dobrovolný a kdykoli odvolatelný. Mlčení, předchozí účast v jiné scéně ani IC bezmoc se za souhlas nepovažují. Po odvolání souhlasu musí citlivý obsah bez diskuse skončit. Trvalé tělesné následky lze odehrát pouze v rámci řádně schváleného CK nebo po výslovné dohodě dotčeného hráče a případném schválení administrací. Bez ohledu na souhlas jsou vždy zakázány scény znásilnění, pedofilie, nekrofilie, zoofilie, kanibalismu, extrémního rasového ponižování a sexuálního násilí. Zakázáno je rovněž používání nejzávažnějších rasových nadávek, vytváření extremistických rasových skupin a samoúčelné detailní zobrazování brutality.",
        "Pravidlo chrání skutečné osoby za postavami. Roleplay nikdy nepřevyšuje osobní hranice, psychickou pohodu ani právo kteréhokoli účastníka citlivou scénu odmítnout bez postihu či nutnosti své rozhodnutí vysvětlovat."
      ),
      rule("Bezvědomí", "Postava v bezvědomí nevnímá okolí a po probuzení má omezené vzpomínky podle průběhu scény.", "Po probuzení je zmatená a vychází z toho, co mohla vnímat před kolapsem.", "Bezvědomý hráč poslouchá rozhovor a později jej celý zopakuje."),
      rule("Únava", "Dlouhá fyzická námaha, nedostatek spánku a stres musí snižovat výkon postavy.", "Po celonoční cestě postava zpomalí a odpočívá.", "Postava několik dní nespí a funguje bez následků."),
      rule("Hlad", "Hlad se projevuje postupným oslabením a nesmí být řešen mechanicky uprostřed nepřerušené akce.", "Postava si během cesty naplánuje zastávku na jídlo.", "Hráč jí při míření zbraní, aby okamžitě doplnil statistiku."),
      rule("Žízeň", "Žízeň vyžaduje pravidelný a bezpečný přísun vody, zejména při námaze a horku.", "Cestovatel veze zásobu vody a při vyčerpání odpočívá.", "Postava po dni v poušti ignoruje dehydrataci.")
    ]
  },
  {
    slug: "kriminalita", title: "Kriminalita", icon: "VI", summary: "Eskalace, loupeže, rukojmí, násilí a trvalá smrt.",
    sections: [
      rule("Loupeže", "Loupež musí mít IC motiv, přiměřenou přípravu a poskytnout oběti prostor pro hodnotný roleplay.", "Lupiči komunikují požadavky, nechají oběť reagovat a vezmou přiměřenou kořist.", "Skupina beze slova okrade každého nováčka o vše."),
      rule("Přepadení", "Přepadení vyžaduje srozumitelnou výzvu a dostatečný čas k reakci, pokud situace bezprostředně neohrožuje útočníka.", "Bandita z krytu jasně vyzve jezdce, aby zastavil.", "Útočník vystřelí bez varování jen proto, aby zabránil útěku."),
      rule("Krádeže", "Krádež musí být technicky i příběhově proveditelná a nesmí cílit na majetek mimo aktivní herní svět.", "Zloděj vypáčí sklad při přítomnosti a riziku svědků.", "Hráč využije odhlášení majitele k vyprázdnění majetku bez RP."),
      rule("Rozsah okradení", "Při okrádání lze odebrat pouze majetek, který má oběť skutečně u sebe a který může v dané scéně fyzicky vydat; cílem nesmí být úplné ekonomické zničení hráče.", "Bandita vezme přiměřenou část hotovosti a cennost, ale ponechá oběti základní prostředky a možnost pokračovat v příběhu.", "Útočník nutí oběť vybírat bankovní účet, otevírat vzdálené sklady nebo odevzdat veškerý majetek a pracovní oprávnění.", "Nelze vynucovat přístup k bance, neaktivnímu táboru, domu, vozu nebo frakčnímu skladu jen pomocí OOC či mechanického nátlaku."),
      rule("Vlaky", "Přepadení vlaku je významná plánovaná akce podléhající aktuálním limitům a přítomnosti státních složek.", "Skupina ověří podmínky, připraví únikovou trasu a rozehraje vyjednávání.", "Jeden hráč opakovaně farmí vlak bez příběhu."),
      rule("Dostavníky", "Dostavník lze přepadnout jen způsobem, který nevyužívá mechanické bezmoci posádky.", "Pachatelé zatarasí cestu a dají kočím možnost rozhodnutí.", "Lupiči střílejí cestující během načítání animace."),
      rule("Banky", "Bankovní loupež je závažná organizovaná scéna s vysokým rizikem a povinností respektovat stanovené podmínky.", "Lupiči mají plán, smysluplné požadavky a přijmou možnost neúspěchu.", "Skupina zneužije slabé aktivity serveru k bezpečnému vybrání banky."),
      rule("Obchody", "Loupež obchodu musí být přiměřená rozsahu místa a nesmí se stát opakovaným bezobsažným zdrojem peněz.", "Pachatel odehraje hrozbu, nervozitu i útěk.", "Hráč mechanicky vykrádá obchod stále stejným způsobem bez interakce."),
      rule("Rukojmí", "Rukojmí musí být skutečný účastník scény, nesmí být spřízněným dobrovolníkem použitým jen k obejití podmínek.", "Únosci chrání hodnotu života rukojmího a umožní mu hrát.", "Kamarád předstírá rukojmí, aby skupina získala volný odjezd."),
      rule("Mučení", "Mučení je citlivý obsah vyžadující OOC souhlas, možnost scénu zastavit a zákaz samoúčelné brutality.", "Účastníci předem stanoví hranice a průběh pouze naznačí.", "Hráč pokračuje v explicitním popisu navzdory nesouhlasu oběti."),
      rule("Výkupné", "Výkupné musí odpovídat hodnotě cíle a ekonomice serveru a nesmí oběť existenčně zničit.", "Únosci požadují částku, kterou lze reálně vyjednat.", "Gang žádá veškerý majetek postavy a hrozí permanentní smrtí."),
      rule("Zabíjení", "Smrtící síla je krajní prostředek vyžadující vážný důvod a přiměřenou eskalaci.", "Pachatel sáhne ke střelbě až při skutečném ohrožení nebo vyvrcholení dlouhého konfliktu.", "Hráč zabíjí svědky automaticky, aby si ušetřil budoucí problém."),
      rule("CK — Character Kill", "CK je trvalé ukončení postavy a vymazání její aktivní kontinuity podle schváleného procesu.", "Hráč připraví uzavření příběhu a respektuje rozhodnutí administrace.", "Skupina jednostranně vnutí CK poraženému za běžnou hádku.", "Dobrovolné i vynucené CK se řídí aktuálním procesem a může vyžadovat předchozí schválení."),
      rule("SelfCK a situační CK", "SelfCK je hráčem zamýšlené trvalé ukončení vlastní postavy; situační CK vzniká jako výjimečný důsledek právě probíhající mimořádně závažné události.", "Hráč předem požádá o SelfCK, doloží dlouhodobý důvod a uzavře závazky postavy; při nepředvídané fatální situaci vše neprodleně zaznamená a předá administraci.", "Hráč použije SelfCK k úniku před soudem nebo během běžné rvačky bez dohody vnutí situační CK protivníkovi.", "SelfCK nesmí obcházet dluhy, stíhání ani jiné následky. Situační CK jiné postavy vyžaduje mimořádně silný důvod a podléhá přezkumu.")
    ]
  },
  {
    slug: "gangy", title: "Gangy", icon: "VII", summary: "Vznik, identita, vztahy a ozbrojené konflikty organizovaných skupin.",
    sections: [
      rule("Zakládání", "Gang vzniká postupným IC vývojem a po splnění aktuálních organizačních podmínek.", "Skupina si vybuduje vztahy, motiv a rozpoznatelnou historii.", "Pět hráčů se první den označí za nejmocnější gang státu."),
      rule("Pravidla gangu", "Vedení odpovídá za kulturu skupiny a nesmí organizovat porušování pravidel.", "Vůdce zastaví neférový plán a poučí nové členy.", "Gang používá početní převahu k systematickému šikanování jednotlivců."),
      rule("Identita", "Gang musí mít uvěřitelnou identitu, cíle a způsob fungování odlišný od OOC přátelské skupiny.", "Členové sdílejí historii a rozdělené role.", "Skupina mění identitu podle toho, která kriminalita právě vydělává."),
      rule("Barvy", "Barvy a symboly jsou IC poznávací znak, nikoli automatický důkaz totožnosti nebo oprávnění k útoku.", "Šerif spojí barvu s dalšími svědectvími a důkazy.", "Gang zastřelí cizince jen proto, že má podobnou vestu."),
      rule("Rozpoznávání a maskování", "Postavu lze spolehlivě určit pouze podle souboru IC znaků a předchozí dostatečné známosti; samotný hlas, barva oděvu, kůň nebo jediný doplněk nestačí.", "Svědek popíše maskovaného pachatele podle výšky, oblečení, sedla a zbraně, ale označí jej pouze za možného podezřelého.", "Hráč bezpečně pozná maskovaného únosce podle hlasu z jednoho dřívějšího rozhovoru a okamžitě jej osloví jménem.", "Nezakrytá tvář, výrazné trvalé rysy a dlouhodobá osobní známost mohou identifikaci podpořit. Maska neodstraňuje nezávislé důkazy."),
      rule("Aliance", "Aliance musí mít příběhový důvod a nesmí obcházet limity počtu účastníků.", "Dvě skupiny uzavřou obchodní dohodu s konkrétními závazky.", "Gangy se spojí jen na jednu akci, aby získaly nepovolenou přesilu."),
      rule("Války", "Válka gangů je dlouhodobý konflikt s jasnou eskalací, cíli a možností ukončení.", "Strany vyjednají podmínky, hranice a přijatelné vítězství.", "Konflikt znamená bezdůvodné střílení kohokoli v barvách soupeře."),
      rule("Nájezdy", "Nájezd na sídlo musí být ohlášen či schválen podle aktuálních limitů a nesmí těžit z nepřítomnosti obránců.", "Útočníci zvolí dobu s reálnou možností obrany a přinesou příběhový cíl.", "Gang vyprázdní tábor soupeře ve čtyři ráno bez jediného obránce.")
    ]
  },
  {
    slug: "civilni-zamestnani", title: "Civilní zaměstnání", icon: "VIII", summary: "Standardy hry profesí, které tvoří každodenní život státu.",
    sections: [
      rule("Rančer", "Rančer pečuje o půdu a zvířata, obchoduje a respektuje vlastnictví i dlouhodobé následky hospodaření.", "Rančer řeší nemoc stáda s lékařem a výpadek promítne do obchodu.", "Hráč používá ranč pouze jako automatický generátor zisku."),
      rule("Lovec", "Lovec dodržuje bezpečnost, přiměřený lov a uvěřitelné zpracování kořisti.", "Sleduje stopu, volí vhodnou zbraň a zužitkuje úlovek.", "Střílí všechna zvířata v okolí jen kvůli rychlému prodeji."),
      rule("Doktor", "Doktor poskytuje zdravotní RP podle znalostí doby a neslibuje zázračné výsledky.", "Vyšetří pacienta, popíše postup a stanoví rekonvalescenci.", "Oživí člověka po smrtelném zásahu bez vysvětlení za několik sekund."),
      rule("Obchodník", "Obchodník vede uvěřitelný podnik, komunikuje se zákazníky a respektuje ekonomiku.", "Vyjednává dodávky, ceny a následky nedostatku.", "Domlouvá kartelové ceny čistě OOC a odmítá RP konkurence."),
      rule("Kovář", "Kovář opravuje a vyrábí předměty s ohledem na materiál, čas a dobovou technologii.", "Zakázku nacení podle práce a odehraje výrobu.", "Okamžitě vyrobí složitý předmět bez surovin."),
      rule("Pošta", "Poštovní pracovník chrání zásilky a důvěrnost, přičemž doručení je IC událost.", "Ztracený dopis řeší vyšetřováním a náhradou.", "Čte soukromé dopisy, aby získal OOC výhodu."),
      rule("Železnice", "Železničář dbá na bezpečnost provozu, jízdní logiku a autoritu své profese.", "Před odjezdem zkontroluje trať a reaguje na překážku.", "Rozjede vlak do lidí, protože mu blokují cestu.")
    ]
  },
  {
    slug: "statni-slozky", title: "Státní složky", icon: "IX", summary: "Pravomoci, odpovědnost a zdrženlivost představitelů veřejné moci.",
    sections: [
      rule("Sheriff", "Šerif chrání okres, vyšetřuje a používá pravomoc přiměřeně dostupným důkazům.", "Podezřelému sdělí důvod zadržení a dokumentuje důkazy.", "Zatkne občana kvůli osobní antipatii bez IC podkladu."),
      rule("Marshal", "Marshal řeší federální a mezikrajské případy a respektuje kompetence místních složek.", "Koordinuje pátrání se šerify a předává informace.", "Přebírá každý malý případ jen díky vyšší hodnosti."),
      rule("Soudce", "Soudce rozhoduje nestranně podle zákona, důkazů a procesních práv.", "Umožní stranám vyjádření a odůvodní rozsudek.", "Předem slíbí trest příteli bez projednání věci."),
      rule("Vláda", "Vláda vytváří IC politiku a nesmí své postavení používat k OOC zvýhodňování.", "Veřejně projedná vyhlášku a přijme politické následky.", "Tajně upraví zákon, aby ochránila majetek vlastního hráče."),
      rule("Lékaři", "Státní či veřejní lékaři zachovávají péči, důvěrnost a neutralitu v mezích bezpečnosti.", "Ošetří i podezřelého a informace sdělí jen v zákonném rozsahu.", "Odmítnou život zachraňující péči kvůli osobnímu sporu."),
      rule("Zadržení a pobyt v cele", "Státní složky smějí postavu držet pouze po dobu potřebnou k bezpečnému dokončení vyšetřování, výslechu a právního procesu; dlouhé omezení hry vyžaduje komunikaci s hráčem.", "Šerif vysvětlí důvod, průběžně poskytuje RP a u delšího procesu si přes LOOC ověří, zda může hráč pokračovat.", "Zadržený zůstane bez interakce zavřený několik hodin, protože na něj státní složka zapomněla.", "Orientační horní hranice běžného zadržení je jedna hodina reálného času. Delší pobyt vyžaduje LOOC souhlas hráče nebo schválení administrace.")
    ]
  },
  {
    slug: "majetek", title: "Majetek", icon: "X", summary: "Vlastnictví, převody a odpovědnost za hodnotný dlouhodobý majetek.",
    sections: [
      rule("Domy", "Dům je IC majetek a jeho užívání, zabezpečení i převod musí probíhat prostřednictvím určených systémů.", "Majitel předá klíče a smlouvu během řádné scény.", "Hráč využije technickou chybu k vstupu do cizího domu."),
      rule("Ranče", "Ranč je dlouhodobý podnik vyžadující aktivitu, péči a respekt k pozemkovým vztahům.", "Majitel zaměstnává lidi a řeší spory IC.", "Drží neaktivní ranč pouze proto, aby jej nikdo jiný nezískal."),
      rule("Firmy", "Firma musí vykazovat smysluplnou činnost a nesmí sloužit k praní mechanických výnosů.", "Vede zakázky, zaměstnance a účetní příběh.", "Převádí peníze mezi vlastními postavami přes fingované obchody."),
      rule("Koně", "Kůň je živý majetek, k němuž se přistupuje s péčí a jehož zranění má následky.", "Jezdec po těžkém pádu koně ošetří a nepokračuje v závodě.", "Používá koně jako spotřební nástroj a ignoruje jeho stav."),
      rule("Dědictví", "Převod majetku po CK musí mít předchozí IC oporu a administrativní soulad.", "Postava dlouhodobě sepsala závěť a dědic projde příběhovým řízením.", "Hráč před CK rychle převede vše na svou novou postavu.")
    ]
  },
  {
    slug: "ekonomika", title: "Ekonomika", icon: "XI", summary: "Férové obchodní vztahy, závazky a příběhové finanční riziko.",
    sections: [
      rule("Obchod", "Každý obchod je IC závazek a ceny musí respektovat stav trhu i zákaz manipulace mechanik.", "Obchodník vyjedná cenu podle nabídky, kvality a dopravy.", "Hráči si OOC domluví umělé ceny, aby vytlačili ostatní."),
      rule("Půjčky", "Půjčka vyžaduje jasné podmínky, přiměřený úrok a reálnou možnost splácení.", "Strany sepíší termín, zástavu a postup při prodlení.", "Věřitel zatají extrémní sankci a následně zabaví vše."),
      rule("Aukce", "Aukce musí být transparentní a nabídky skutečně závazné.", "Pořadatel zveřejní podmínky a přijme nejvyšší platnou nabídku.", "Kamarád pořadatele uměle navyšuje cenu bez úmyslu koupit."),
      rule("Podvody", "IC podvod je možný pouze jako uvěřitelný příběh a nesmí zneužívat OOC důvěru či technickou chybu.", "Falešný obchodník předloží IC padělek, který lze odhalit.", "Hráč slíbí OOC bezpečný převod a po potvrzení majetek ukradne.")
    ]
  },
  {
    slug: "administrativa", title: "Administrativa", icon: "XII", summary: "Správný způsob řešení problémů, důkazů a technických náhrad.",
    sections: [
      rule("Tickety", "Ticket je soukromý kanál pro konkrétní problém a musí obsahovat věcný popis a dostupné důkazy.", "Hráč uvede čas, účastníky, průběh a odkaz na záznam.", "Otevře několik ticketů a uráží tým kvůli rychlosti odpovědi."),
      rule("Reporty", "Report slouží k naléhavému upozornění, nikoli k vítězství v aktivní scéně.", "Hráč scénu dohraje, uloží důkaz a reportuje závažné porušení.", "Reportuje každé IC zatčení jako údajné zneužití pravomoci."),
      rule("Žádosti", "Žádost musí využít správný formulář, úplné informace a pravdivé údaje.", "Žadatel popíše cíl, dopad a potřebné souhlasy.", "Zamlčí související zamítnutí v jiném ticketu."),
      rule("Revive", "Administrativní revive je technický zásah, nikoli náhrada lékařského RP nebo způsob úniku z následků.", "Po potvrzeném bugu admin obnoví stav a scéna naváže.", "Hráč žádá revive po férově prohrané přestřelce."),
      rule("Vrácení majetku", "Majetek se vrací pouze při doložené technické ztrátě, nikoli po běžném IC riziku.", "Hráč předloží video a přesný seznam ztracených věcí.", "Po loupeži žádá administraci o vrácení legitimně ukradených peněz.")
    ]
  },
  {
    slug: "whitelist", title: "Whitelist", icon: "XIII", summary: "Podmínky přijetí, průběh pohovoru a další pokusy.",
    sections: [
      rule("Podmínky", "Uchazeč musí splnit zveřejněný věk, technické požadavky a prokázat znalost pravidel.", "Před podáním si pravidla přečte a připraví vlastní postavu.", "Podá žádost bez mikrofonu a očekává výjimku bez důvodu."),
      rule("Pohovor", "Pohovor ověřuje porozumění, úsudek a schopnost vysvětlit řešení modelové situace.", "Uchazeč přemýšlí nahlas a přizná nejistotu.", "Odpovědi mechanicky čte nebo mu je napovídá další osoba."),
      rule("Zamítnutí", "Zamítnutí znamená, že uchazeč v danou chvíli nesplnil požadavky, nikoli osobní odsouzení.", "Převezme zpětnou vazbu a doplní znalosti.", "Napadá examinátora a obchází rozhodnutí přes jiné členy týmu."),
      rule("Opakování", "Další pokus lze absolvovat až po stanovené lhůtě a prokazatelném zlepšení.", "Uchazeč si procvičí slabé oblasti a vrátí se připravený.", "Zakládá nové účty, aby obešel čekací dobu.")
    ]
  },
  {
    slug: "sankce", title: "Sankce", icon: "XIV", summary: "Druhy postihů, přiměřenost a právo na věcné odvolání.",
    sections: [
      rule("Warn", "Warn je evidované upozornění za méně závažné nebo první porušení a obsahuje poučení.", "Hráč přijme vysvětlení a stejné jednání neopakuje.", "Ignoruje warn s tím, že nejde o ban."),
      rule("Ban", "Ban je dočasné odebrání přístupu na dobu odpovídající závažnosti a historii hráče.", "Hráč využije čas k pochopení chyby a po návratu dodržuje podmínky.", "Obchází ban alternativním účtem."),
      rule("Permanent Ban", "Permanentní ban je neurčité odebrání přístupu při závažném porušení, podvodu nebo dlouhodobém riziku pro komunitu.", "Potrestaný respektuje zákaz a případně využije povolený proces odvolání.", "Po cheatingu se okamžitě vrací pod cizí identitou."),
      rule("Odvolání", "Odvolání je věcná žádost o přezkum založená na konkrétní chybě, novém důkazu nebo nepřiměřenosti.", "Hráč popíše rozhodnutí, důvody nesouhlasu a přiloží důkazy.", "Mobilizuje přátele k nátlaku a osobním útokům na administrátora.", "Odvolání nezaručuje změnu trestu; opakované podání bez nových skutečností může být uzavřeno.")
    ]
  },
  {
    slug: "akademie", title: "Deadstone Akademie", icon: "XV", summary: "Praktický návod, jak přesvědčivě hrát typické role a náročné stavy.",
    sections: [
      rule("Jak RPit doktora", "Doktor se ptá, vyšetřuje a postupuje od základních příznaků k dobově přiměřené léčbě.", "Nechá pacienta popsat bolest, zkontroluje ránu a vysvětlí omezení.", "Diagnózu určí bez kontaktu a každého okamžitě vyléčí."),
      rule("Jak RPit šerifa", "Šerif kombinuje autoritu se zdrženlivostí, vyšetřováním a odpovědností za veřejnost.", "Nejprve zajišťuje bezpečí, sbírá svědectví a až poté obviňuje.", "Vyvolává přestřelku kvůli drobnému přestupku."),
      rule("Jak RPit banditu", "Bandita potřebuje motiv, hranice a strach z dopadení; není bezmyšlenkovitý vrah.", "Plánuje zisk, skrývá identitu a vyjednává.", "Přepadá každého bez slova a bez obavy ze zákona."),
      rule("Jak RPit farmáře", "Farmář staví příběh na cyklu práce, počasí, trhu, sousedství a rodinných závazcích.", "Neúrodu promění v dluh, jednání s obchodníkem a spor o vodu.", "Pouze opakuje mechanickou sklizeň bez kontaktu s okolím."),
      rule("Jak RPit obchodníka", "Obchodník tvoří vztahy prostřednictvím poptávky, reputace, dopravy a vyjednávání.", "Pamatuje si spolehlivé zákazníky a reaguje na nedostatek.", "Prodává vždy za stejnou cenu bez ohledu na situaci."),
      rule("Jak RPit zranění", "Zranění se hraje hlasem, omezením pohybu, rozhodování a následnou rekonvalescencí.", "Postřelený se kryje, šetří ruku a po ošetření odpočívá.", "Zranění končí okamžikem doplnění herní statistiky."),
      rule("Jak RPit strach", "Strach neznamená vždy poslušnost, ale musí ovlivnit řeč, tělo a volbu rizika.", "Postava koktá, hledá únikovou cestu a vyjednává.", "Směje se při namířené zbrani bez opory v charakteru."),
      rule("Jak RPit alkohol", "Opilost se stupňuje a ovlivňuje koordinaci, úsudek i paměť; neslouží jako omluva pro trolling.", "Po několika sklenkách postava mluví pomaleji a dělá horší rozhodnutí.", "Hráč křičí, obtěžuje okolí a vše omlouvá alkoholem."),
      rule("Jak RPit smrt", "Smrt se hraje střídmě, s respektem k uzavření vztahů a následkům pro komunitu.", "Poslední scéna navazuje na dlouhodobý příběh a dává ostatním prostor.", "Postava náhodně umře, aby se zbavila dluhů, a majetek předá nástupci."),
      rule("Jak RPit únos", "Únos musí vytvářet hru i unesenému, mít cíl, tempo, bezpečné hranice a možnost řešení.", "Únosci vedou dialog, vysvětlí požadavky a reagují na vyjednávání.", "Drží hráče hodiny beze slova jen proto, aby nemohl hrát.")
    ]
  },
  {
    slug: "faq", title: "Často kladené otázky", icon: "XVI", summary: "Odpovědi na situace, které nejčastěji řeší noví i zkušení hráči.",
    sections: [
      rule("Co když neznám RP pojem?", "Nejistota není problém, pokud hráč jedná opatrně, nenaruší scénu a po jejím skončení si pojem ověří.", "Nováček použije LOOC jen kvůli nezbytnému vysvětlení a poté pokračuje.", "Zastaví celou scénu a požaduje dlouhou OOC přednášku."),
      rule("Co když mi spadne hra?", "Po technickém pádu je hráč povinen co nejrychleji informovat účastníky a vrátit se do stejné situace.", "Napíše do určeného kanálu a po připojení naváže zadržením.", "Využije pád jako důvod, proč se do prohrané scény nevrátit."),
      rule("Mohu hrát více postav?", "Více postav je možné jen při důsledném oddělení jejich informací, vztahů a majetku.", "Druhá postava nezná tajemství získané první postavou.", "Vlastní postavy si navzájem převádějí peníze a informace."),
      rule("Střet zájmů více postav", "Postavy jednoho hráče nesmějí působit na protilehlých stranách stejného aktivního konfliktu ani si přímo či nepřímo vzájemně prospívat.", "Hráč předem konzultuje druhou postavu a zvolí jí nezávislé prostředí bez vazby na svou hlavní frakci.", "Jednou postavou získá policejní spis a druhou varuje gang nebo obě postavy zapojí do stejné obchodní sítě.", "Další slot postavy může podléhat schválení. Při neočekávaném střetu zájmů hráč jednu postavu dočasně stáhne a situaci oznámí administraci."),
      rule("Kdy volat administrátora?", "Administrátor se volá při závažném porušení, technické blokaci nebo ohrožení komunity, ne kvůli běžné IC nevýhodě.", "Hráč dokončí bezpečnou scénu a přiloží důkaz.", "Uprostřed zatčení odmítne pokračovat, dokud nepřijde admin."),
      rule("Musím vždy vyhrát?", "Roleplay nemá objektivního vítěze; kvalitní výsledek je uvěřitelný příběh s následky.", "Hráč přijme ztrátu a rozvine z ní nový motiv.", "Za hodnotnou považuje jen scénu, v níž získal majetek nebo převahu.")
    ]
  },
  {
    slug: "slovnik", title: "Slovník RP pojmů", icon: "XVII", summary: "Rychlý, ale přesný přehled základních termínů roleplaye.",
    sections: [
      rule("IC / OOC", "IC je svět postav; OOC je skutečný svět hráčů. Informace mezi nimi nelze volně přenášet.", "Hráč oddělí osobní sympatie od vztahu postav.", "OOC spor přenese do IC pomsty."),
      rule("PK — Player Kill", "PK je dočasné vyřazení postavy ze scény, zpravidla s omezením vzpomínek a pokračující existencí postavy.", "Postava po zotavení respektuje mezery v paměti.", "PK označí za úplné vymazání všech dluhů a vztahů."),
      rule("CK — Character Kill", "CK je definitivní konec konkrétní postavy a její aktivní kontinuity.", "Příběh je uzavřen podle schváleného procesu.", "Hráč po CK vytvoří totožnou postavu se stejnými vzpomínkami."),
      rule("NLR — New Life Rule", "NLR upravuje návrat po vyřazení, omezení vzpomínek a zákaz okamžité odvety.", "Hráč se nevrátí do právě probíhající přestřelky.", "Po oživení okamžitě označí pachatele podle OOC obrazu."),
      rule("RP / FailRP", "RP je uvěřitelné jednání postavy; FailRP je závažné porušení logiky postavy či světa.", "Rozhodnutí vychází z motivů a okolností.", "Hráč ignoruje prostředí, následky i druhé účastníky."),
      rule("MG / PG", "MG znamená metagaming; PG znamená powergaming. První zneužívá informace, druhý vnucuje výsledek.", "Hráč používá jen IC znalosti a popisuje pokusy.", "Z Discordu zjistí polohu a bez reakce protivníka jej spoutá.")
    ]
  },
  {
    slug: "zmeny-pravidel", title: "Změny pravidel", icon: "XVIII", summary: "Platnost dokumentu, oznamování úprav a odpovědnost hráče.",
    sections: [
      rule("Platnost pravidel", "Platná je vždy aktuální zveřejněná verze pravidel označená datem účinnosti.", "Hráč před návratem po delší pauze zkontroluje změny.", "Odvolává se na starý screenshot pravidla, které bylo řádně změněno."),
      rule("Oznamování změn", "Podstatné změny jsou oznámeny v určeném komunitním kanálu a zapsány v přehledu verzí.", "Hráč si přečte oznámení před další hrou.", "Ignoruje oznámení a tvrdí, že změna neplatí."),
      rule("Přechodná období", "Administrace může u složitých změn určit období pro přizpůsobení postav, majetku nebo příběhů.", "Skupina včas upraví fungování podle nové úpravy.", "Během přechodné doby záměrně maximalizuje výhodu starého systému."),
      rule("Odpovědnost hráče", "Každý hráč odpovídá za průběžnou znalost pravidel a ověření nejasnosti před rizikovým jednáním.", "Před velkou kriminální akcí si zkontroluje aktuální limity.", "Spoléhá na ústní tvrzení jiného hráče místo zveřejněného dokumentu.")
    ]
  }
];

// Ve veřejném dokumentu zůstávají pouze závazná serverová pravidla.
// Návody k profesím, whitelistu a běžným herním potřebám patří do samostatné akademie, nikoli sem.
const excludedChapters = new Set([
  "civilni-zamestnani",
  "majetek",
  "ekonomika",
  "whitelist",
  "akademie",
  "faq"
]);

window.RULE_CHAPTERS = window.RULE_CHAPTERS
  .filter(chapter => !excludedChapters.has(chapter.slug))
  .map(chapter => {
    if (chapter.slug !== "realismus") return chapter;
    const excludedRealismRules = new Set(["Nemoci", "Únava", "Hlad", "Žízeň"]);
    return {
      ...chapter,
      sections: chapter.sections.filter(section => !excludedRealismRules.has(section.name))
    };
  });

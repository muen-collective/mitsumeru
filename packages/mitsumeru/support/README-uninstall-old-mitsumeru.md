# Removing the old Mitsumeru — for Noi

You have two versions of Mitsumeru on your Mac. One is the current app you use.
The other is an older copy that we no longer update. This removes the old one.

Nothing you have now will change. Your current Mitsumeru and everything in it
stays exactly as it is.

---

## How to do it

**1.** Download `uninstall-old-mitsumeru.command` from your Discord channel.
It will land in your **Downloads** folder.

**2.** **Right-click** it (or hold Control and click), then choose **Open**.

**3.** A window appears asking if you want to open it. Click **Open**.

> The right-click step matters. If you just double-click it, a Mac will say it
> "cannot be opened because it is from an unidentified developer" — that is
> normal for a file sent over the internet, and the right-click way is how you
> say "I know this one, go ahead" one time only. After the first time, it opens
> normally.

**4.** A black window opens and shows you a list of what it is going to remove,
with the size of each item. It looks like this:

```
  The following will be removed:

    /Applications/Mitsumeru Dev.app              842M
    ~/Library/Application Support/dsh-desktop-dev 882M
    ...
    Total: 1.7G

  Your current Mitsumeru and its settings are NOT on this list.

  Press Return to remove these, or press Control-C to cancel.
```

**5.** Read the list if you like, then **press Return**.

It works through the list in a few seconds. At the end it tells you how much
space it freed and confirms your current Mitsumeru is still there.

**6.** Close the window. Done.

---

## What it removes, and what it does not

**Removes** — the old app and the files it kept for itself:

| | |
|---|---|
| the old "Mitsumeru Dev" app | about 840 MB |
| the old app's own data | about 880 MB |
| a few small leftover files | about 1.8 MB |

**About 1.7 GB in total.**

**Never touches:**

- your current **Mitsumeru** app
- your current Mitsumeru settings and your work

The script checks the *identity* of the current app before it starts, rather
than trusting the name. If it ever finds something unexpected it stops and
removes nothing.

---

## If something looks wrong

The window prints a report at the end. If it says anything other than "Done",
or if you are not sure, **take a screenshot of that window** and send it to us.
Nothing is half-finished in a way you need to fix yourself.

You can also run it twice by accident — the second time it will simply say
there is nothing left to remove.

---

## For us (not for Noi)

`uninstall-old-mitsumeru.command` is the script. Run
`test-uninstall-old-mitsumeru.sh` to check it against a sandbox before sending a
copy to anyone — it builds a fake machine and asserts the old app goes and the
new one survives.

Two things worth knowing when handing this out:

- **The old app's data folder is called `dsh-desktop-dev`**, not anything with
  "Mitsumeru" in it. That is 880 MB of the 1.7 GB, and it is the part a person
  tidying up by hand would miss. Conversely, a folder simply called
  `Mitsumeru` belongs to the **current** app — deleting that would wipe the new
  app's settings.
- **A downloaded `.command` is quarantined by macOS and will be refused**
  (`spctl: rejected`) if double-clicked. Hence the right-click → Open step
  above. If that ever becomes too much friction, the fix is to ship it signed
  rather than to explain it better.

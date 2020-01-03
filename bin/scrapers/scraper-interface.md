# Scraper Interface Definition
The scraper module must expose the following functionality:
1. Return the name of the university it is associated with: for example the UCI scraper should report "UC Irvine".
2. Return a list of departments available at that university.
3. Return a list of course levels available (for example, "lower-div, upper-div, undergraduate, graduate".
4. Return a list of terms available (for example, "Fall 2019, Winter 2019...")
5. Return the current term based on the date, which must appear in the list of terms.
6. Return a list of classes associated with a department and term. The required parameters for each class appear later in this definition.
7. (maybe?) Report the next date when the scraper should be run.


## Required Parameters for a Class
A call to the scraper: `scraper.run(string term, string department, [string level])`
shall return a list of courses with the following parameters:
```
[{
    department  : String, // e.g. "ENGR"
    courseCode  : String, // e.g. "20A"
    courseTitle : String,
    sections    : [{
        meetings   : [{
            bldg      : String,
            enrolled  : Number, // students enrolled under this listing
            timeIsTBA : Boolean, // If true, class has no scheduled time
            startTime : Number,  // Minutes since 12am
            endTime   : Number,  // Minutes since 12am, strictly > startTime
            days      : [Number] // Days this class occurs, starting at Monday=0
        }]
    }]
 ```

#### Cross-Listings
If a class is cross-listed, `enrolled` shall be the number of students enrolled under `department`, not the total for all cross-listed departments.

#### Classes, Sections and Meetings
A Class has a single `courseCode` and shall contain at least one Section. For example, MATH 3D is one class with 2 Sections: lecture and discussion.

A Section shall contain at least one Meeting. A Section may be a lecture, discussion, lab, tutorial, or other course meeting. If MAE 30 has lecture TuTh at 9:30AM and two possible discussion sections on Wednesday at 1PM and Friday at 2PM, that is 3 Sections.

A Meeting is a calendar event. A Meeting has a single start and end time, which can occur on multiple days.
If a Section meets MW from 9:00 - 10:50AM and Friday from 9 - 9:50AM, that is two Meetings. All Meetings for a Section share one `enrolled` count.

#### TBA and No Meeting Time
Sections with no meeting time, for example online sections and course codes pertaining to independent study, internship, or research, shall be reported with `timeIsTba = true`.

#### Missing Enrollment Count
If the `enrolled` parameter is not available, the scraper shall report `enrolled=0`.
// TODO: Should we instead report NaN?


## Interface Definition
### For immediate implementation
**`[string] = scraper.departments()`**
**Parameters:** none.
**Returns:** A list of strings corresponding to department names.
**Example:** `["CS", "EECS", "CSE"...]`

**`[string] = scraper.terms()`**
**Parameters:** none.
**Returns:** A list of strings corresponding to available terms.
**Example:** `["Fall 2019", "Winter 2019"]`

**`[string] = scraper.levels()`**
**Parameters:** none.
**Returns:** A list of strings corresponding to available levels.
**Example:** `["Lower-div", "Upper-div", "Graduate"]`
Application note: Finer divisions may be possible at some universities: for example "Graduate" could be split into "Masters" and "PhD"

**`string = scraper.currentTerm()`**
**Parameters:** none.
**Returns:** The current term. This term must appear in `scraper.terms()`.

**`string = scraper.name()`**
**Parameters:** none.
**Returns:** The university name.

**`[Course] = scraper.run(string term, string department, [string level])`**
**Parameters:** `term` is a string from the list returned by `scraper.levels()`
`department` is a string from the list returned by `scraper.departments()`
optional `level` is from the list returned by `scraper.levels()`
**Returns:** a list of Course objects.
**Example:** `courses = scraper.run("Fall 2019", "CS");`


### Future implementation (additional features)
**`{string:[string]} = scraper.levelSets()`**
**Parameters:** none.
**Returns:** A dictionary corresponding to sets of two or more level names which form a logical group.
**Example:** "Lower-div" and "Upper-div" group into "Undergraduate":
`{"Undergraduate":["Lower-div", "Upper-div"]}`
No key in `levelSets` shall appear in `levels`. This means if `levels` includes "Undergraduate", `levelSets` may not.

**`{string:[string]} = scraper.departmentSets()`**
**Parameters:** none.
**Returns:** A dictionary corresponding to sets of two or more department names which form a logical group.
**Example:** Several Engineering majors group into the set "Engineering":
`{"Engineering":["MAE", "BME", "CEE", "CHEME", "EE", "CSE"]}`
No key in `departmentSets` shall appear in `departments`.

**`Date = scraper.nextRun()`**
**Parameters:** none.
**Returns:** The Date object corresponding to the next time the scraper should be run for the current term.
Application note: This enables scraping more often while enrollment is open, then stopping once enrollment has closed.
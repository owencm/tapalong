//
//  ActivitesViewController.m
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "AppDelegate.h"
#import "ActivitesViewController.h"
#import "ActivityTableCell.h"
#import "Activity.h"
#import "Activities.h"
#import "CreateActivityViewController.h"
#import "ActivityDetailViewController.h"
#import "GlobalStyles.h"
#import "GlobalNetwork.h"
#import <CoreText/CoreText.h>

@interface ActivitesViewController ()

@end

@implementation ActivitesViewController

- (id)init
{
    self = [super init];
    if (self) {
        self.title = @"Activities";
        // Get a copy of the Activities model from the AppDelegate and register as a listener
        AppDelegate *appDelegate = (AppDelegate*) [[UIApplication sharedApplication] delegate];
        activities = appDelegate.activities;
        [activities addListener:self];
        
        // Padd the bottom of the table with 20 pixels
        self.tableView.contentInset = UIEdgeInsetsMake(0, 0, 20, 0);
        // Hide the separators
        self.tableView.separatorStyle = UITableViewCellSeparatorStyleNone;
    }
    return self;
}

// How does this differ from init?
- (void)viewDidLoad
{
    [super viewDidLoad];
    
    // Set the background to a pleasant grey
    [[self view] setBackgroundColor:[[GlobalStyles sharedGlobal] backgroundGreyColor]];
    
    // Add the 'add' button
    UIBarButtonItem *addBarButton = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemAdd target:self action:@selector(createButtonPressed:)];
    self.navigationItem.rightBarButtonItem = addBarButton;
}

-(void) activitiesChanged
{
    NSLog(@"\n\nRefreshing view due to updated data\n\n");
    [self.tableView reloadData];
}

- (IBAction) createButtonPressed:(id)sender
{
    CreateActivityViewController *createActivityViewController = [[CreateActivityViewController alloc] initWithNibName:@"CreateActivityViewController" bundle:nil];
    [self.navigationController pushViewController:createActivityViewController animated:YES];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return [activities upcomingCount];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *CellIdentifier = @"Cell Identifier";
    ActivityTableCell *cell = (ActivityTableCell *)[tableView dequeueReusableCellWithIdentifier:CellIdentifier];
    if (cell == nil)
    {
        NSArray *nib = [[NSBundle mainBundle] loadNibNamed:@"ActivityTableCell" owner:self options:nil];
        cell = [nib objectAtIndex:0];
    }
    
    Activity *activity = [activities activityAtIndex:indexPath.row];
    [self setTextInCell:cell activity:activity];
    [cell refreshLayout];
    
    [cell.viewDetailsButton addTarget:self action:@selector(viewDetailsPressed:) forControlEvents:UIControlEventTouchUpInside];
    
    return cell;
}

- (void)setTextInCell:(ActivityTableCell *)cell activity:(Activity *)activity {
    cell.activityLabel.attributedText = [self getAttributedActivity:activity];
}

-(NSMutableAttributedString *)getAttributedActivity:(Activity *)activity {
    
    NSDate *baseDate = [activity start_time];
    
    // determine the NSDate for midnight of the base date:
    NSCalendar* calendar = [NSCalendar currentCalendar];
    NSDateComponents* comps = [calendar components:(NSYearCalendarUnit|NSMonthCalendarUnit|NSDayCalendarUnit)
                                          fromDate:baseDate];
    NSDate* theMidnightHour = [calendar dateFromComponents:comps];
    
    NSDate *today = [NSDate dateWithTimeIntervalSinceNow:0];
    NSDate *tomorrow = [NSDate dateWithTimeIntervalSinceNow:24*60*60];
    
    NSString *dateString = @"";
    
    // Tidy me up plz
    NSTimeInterval interval = [today timeIntervalSinceDate:theMidnightHour];
    if (interval >= 0 && interval < 60*60*24) {
        // It's today
        dateString = @" Today at ";
    } else { // If it's not today, continue
        interval = [tomorrow timeIntervalSinceDate:theMidnightHour];
        if (interval >= 0 && interval < 60*60*24) {
            // It's tomorrow
            dateString = @" Tomorrow at ";
        } else { // If it's not tomorrow do the general case
            NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
            [dateFormatter setDateFormat:@"EEEE"];
            dateString = [[@" on " stringByAppendingString: [dateFormatter stringFromDate:[activity start_time]]] stringByAppendingString: @" at "];
        }
    }
    
    // Set the formatter tp produce strings of the format 7:30PM
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    [dateFormatter setDateFormat:@"h:mma"];
    
    // Append the date to the time
    dateString = [dateString stringByAppendingString:[dateFormatter stringFromDate:[activity start_time]]];
    
    NSString *titleString = [[activity title] capitalizedString];
    NSString *userNameString = @"Owen Campbell-Moore";
    
    NSString *joinedString = [[[userNameString stringByAppendingString:@" is "] stringByAppendingString:titleString]stringByAppendingString:dateString];
    
    NSMutableAttributedString *attributedString =
    [[NSMutableAttributedString alloc] initWithString:joinedString
                                           attributes:@{}];
    
    // Define preset styles we will use
    NSDictionary *regularTextAttributes = [[GlobalStyles sharedGlobal] regularTextAttributes];
    NSDictionary *emphasisTextAttributes = [[GlobalStyles sharedGlobal] emphasisTextAttributes];
    
    // Set sections of the text to have the correct styles
    NSRange userNameRange = {0, [userNameString length]};
    [attributedString setAttributes:emphasisTextAttributes range:userNameRange];
    
    NSRange titleRange = {[userNameString length]+4, [titleString length]};
    [attributedString setAttributes:emphasisTextAttributes range:titleRange];
    
    NSRange isRange = {[userNameString length], 4};
    [attributedString setAttributes:regularTextAttributes range:isRange];

    NSRange dateRange = {[userNameString length]+4+[titleString length], [dateString length]};
    [attributedString setAttributes:regularTextAttributes range:dateRange];
    
    return attributedString;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    Activity *activity = [activities activityAtIndex:indexPath.row];
    NSAttributedString *attributedString = [self getAttributedActivity:activity];

    // Size the attributed string
    CTFramesetterRef framesetter = CTFramesetterCreateWithAttributedString((__bridge CFAttributedStringRef)attributedString);
    CGSize targetSize = CGSizeMake(217, CGFLOAT_MAX);
    CGSize fitSize = CTFramesetterSuggestFrameSizeWithConstraints(framesetter, CFRangeMake(0, [attributedString length]), NULL, targetSize, NULL);
    CFRelease(framesetter);
    
    return fitSize.height + 77;
}

- (IBAction) viewDetailsPressed:(id)sender {
    ActivityDetailViewController *activityDetailViewController = [[ActivityDetailViewController alloc] initWithNibName:@"ActivityDetailViewController" bundle:nil];
    [self.navigationController pushViewController:activityDetailViewController animated:YES];
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
//    ActivityTableCell *cell = (ActivityTableCell *)[tableView cellForRowAtIndexPath:indexPath];
}

-(void)tableView:(UITableView *)tableView didDeselectRowAtIndexPath:(NSIndexPath *)indexPath {
//    ActivityTableCell *cell = (ActivityTableCell *)[tableView cellForRowAtIndexPath:indexPath];
}

- (void)tableView:(UITableView *)tableView willDisplayCell:(UITableViewCell *)cell forRowAtIndexPath:(NSIndexPath *)indexPath
{
    cell.backgroundColor = [[GlobalStyles sharedGlobal] backgroundGreyColor];
}



@end

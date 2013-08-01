//
//  ActivitesViewController.m
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "ActivitesViewController.h"
#import "ActivityTableCell.h"
#import "Activity.h"
#import "CreateActivityViewController.h"
#import "GlobalColors.h"
#import "GlobalNetwork.h"
#import <CoreText/CoreText.h>

@interface ActivitesViewController ()

@end

@implementation ActivitesViewController

- (id)init
{
    self = [super init];
    if (self) {
        self.title = @"Activites";
        // Padd the bottom of the table with 20 pixels
        self.tableView.contentInset = UIEdgeInsetsMake(0, 0, 20, 0);
        // Hide the separators
        self.tableView.separatorStyle = UITableViewCellSeparatorStyleNone;
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    // Set the background to a pleasant grey
    [[self view] setBackgroundColor:[[GlobalColors sharedGlobal] backgroundGrey]];
    
    // This adds a button with a custom image and no box/border
    UIButton *addButton = [UIButton buttonWithType:UIButtonTypeCustom];
    [addButton setFrame:CGRectMake(0.0f, 0.0f, 25.0f, 25.0f)];
    [addButton setImage:[UIImage imageNamed:@"addButton.png"] forState:UIControlStateNormal];
    [addButton setImage:[UIImage imageNamed:@"addButton.png"] forState:UIControlStateHighlighted];
    [addButton addTarget:self action:@selector(createButtonPressed:) forControlEvents:UIControlEventTouchUpInside];
    UIBarButtonItem *addBarButton = [[UIBarButtonItem alloc] initWithCustomView:addButton];
    self.navigationItem.rightBarButtonItem = addBarButton;
    
    // Initialise the activities array
    self.activities = [[NSArray alloc] init];
    
    // Download activities from the server and display them
    [[GlobalNetwork sharedGlobal] getActivities:^(NSArray *result)
        {
            self.activities = result;
            [[self tableView] reloadData];
        }
     ];
    
    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;
 
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
    return [self.activities count];
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
    
    Activity *activity = [self.activities objectAtIndex:indexPath.row];
    NSString *titleString = [[activity title] capitalizedString];
    NSString *descriptionString = [activity description];
    NSString *locationString = [activity location];
    NSString *dateString = @" tomorrow at 7pm";
    NSString *userNameString = @"Owen Campbell-Moore";
    [self setTextInCell:cell titleString:titleString userNameString:userNameString descriptionString:descriptionString locationString:locationString dateString:dateString];
    [cell refreshLayout];
    
    return cell;
}

- (void)setTextInCell:(ActivityTableCell *)cell titleString:(NSString *)titleString userNameString:(NSString *)userNameString descriptionString:(NSString *)descriptionString locationString:(NSString *)locationString dateString:(NSString *)dateString {
    cell.activityLabel.attributedText = [self getAttributedActivity:userNameString titleString:titleString dateString:dateString];
}

-(NSMutableAttributedString *)getAttributedActivity:(NSString *)userNameString titleString:(NSString *)titleString dateString:(NSString *)dateString
{
    NSString *joinedString = [[[userNameString stringByAppendingString:@" is "] stringByAppendingString:titleString] stringByAppendingString:dateString];
    
    // Define general attributes for the entire String
    NSDictionary *attribs = @{};
    
    // Define preset styles we will use
    UIFont *largeString = [UIFont fontWithName:@"Roboto" size:16];
    UIFont *smallString = [UIFont fontWithName:@"Roboto-Light" size:14];
    UIColor *darkGreyText = [[GlobalColors sharedGlobal] darkGreyText];
    UIColor *lightGreyText = [[GlobalColors sharedGlobal] lightGreyText];
    NSDictionary *largeStringAttributes = @{NSFontAttributeName: largeString,
                                         NSForegroundColorAttributeName: darkGreyText};
    NSDictionary *smallStringAttributes = @{NSFontAttributeName: smallString,
                                          NSForegroundColorAttributeName: lightGreyText};
    
    NSMutableAttributedString *attributedString =
    [[NSMutableAttributedString alloc] initWithString:joinedString
                                           attributes:attribs];
    NSRange userNameRange = {0, [userNameString length]};
    NSRange isRange = {[userNameString length], 4};
    NSRange titleRange = {[userNameString length]+4, [titleString length]};
    NSRange dateRange = {[userNameString length]+4+[titleString length], [dateString length]};
    [attributedString setAttributes:largeStringAttributes range:userNameRange];
    [attributedString setAttributes:smallStringAttributes range:isRange];
    [attributedString setAttributes:largeStringAttributes range:titleRange];
    [attributedString setAttributes:smallStringAttributes range:dateRange];
    
    return attributedString;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    Activity *activity = [self.activities objectAtIndex:indexPath.row];
    NSAttributedString *attributedString = [self getAttributedActivity:@"Owen Campbell-Moore" titleString:[activity title] dateString:@" tomorrow at 7pm"];

    // Size the attributed string
    CTFramesetterRef framesetter = CTFramesetterCreateWithAttributedString((__bridge CFAttributedStringRef)attributedString);
    CGSize targetSize = CGSizeMake(217, CGFLOAT_MAX);
    CGSize fitSize = CTFramesetterSuggestFrameSizeWithConstraints(framesetter, CFRangeMake(0, [attributedString length]), NULL, targetSize, NULL);
    CFRelease(framesetter);
    
    return fitSize.height + 70;
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
    cell.backgroundColor = [[GlobalColors sharedGlobal] backgroundGrey];
}

@end
